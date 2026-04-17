// Pipeline: when the internal directory yields fewer than N hits for a query,
// pull candidate images from Tavily, classify each with GPT-5.4-nano in
// parallel, then clean the accepted ones with Replicate qwen/qwen-image-2-pro
// sequentially, upload to Supabase Storage, and insert into `activities`.

import { createServerClient } from "@/lib/supabase/server"
import { collectImageCandidates, tavilySearchImages, type TavilyImage } from "@/lib/tavily"
import { classifyImageCandidate, type ClassifiedImage } from "@/lib/openai-classifier"
import { replicateCleanImage } from "@/lib/replicate"
import type { Activity } from "@/lib/supabase/types"
import { randomUUID } from "node:crypto"

export interface EnrichmentResult {
  accepted: Activity[]
  inspected: number
  rejected: number
  failures: number
}

// Only "high" reaches ingestion. Anything below is discarded before we spend
// Replicate budget on it, so every row stored via Tavily has quality_score 0.9.
const MIN_ACCEPTED_QUALITY: ClassifiedImage["quality"] = "high"
const HIGH_QUALITY_SCORE = 0.9

async function fetchBuffer(url: string): Promise<{ buffer: Buffer; contentType: string }> {
  const controller = new AbortController()
  const t = setTimeout(() => controller.abort(), 25_000)
  try {
    const res = await fetch(url, { signal: controller.signal })
    if (!res.ok) throw new Error(`download_${res.status}`)
    const contentType = (res.headers.get("content-type") ?? "image/png").split(";")[0].trim()
    const arrayBuf = await res.arrayBuffer()
    return { buffer: Buffer.from(arrayBuf), contentType }
  } finally {
    clearTimeout(t)
  }
}

interface ClassifiedCandidate {
  image: TavilyImage
  meta: ClassifiedImage
}

async function classifyInParallel(
  candidates: TavilyImage[],
  query: string,
): Promise<ClassifiedCandidate[]> {
  const results = await Promise.allSettled(
    candidates.map(async (image) => ({ image, meta: await classifyImageCandidate(image.url, query) })),
  )
  const classified: ClassifiedCandidate[] = []
  for (const r of results) {
    if (r.status === "fulfilled") classified.push(r.value)
  }
  return classified.filter(
    (c) => c.meta.usable && c.meta.portrait && c.meta.quality === MIN_ACCEPTED_QUALITY,
  )
}

export async function enrichFromTavily(
  query: string,
  need: number,
  options: { maxCandidates?: number; overallDeadlineMs?: number } = {},
): Promise<EnrichmentResult> {
  const supabase = createServerClient()
  const cap = Math.min(options.maxCandidates ?? 10, 20)
  const deadline = Date.now() + (options.overallDeadlineMs ?? 75_000)

  const tavily = await tavilySearchImages(query, { maxResults: cap })
  const candidates = collectImageCandidates(tavily).slice(0, cap)
  if (candidates.length === 0) {
    return { accepted: [], inspected: 0, rejected: 0, failures: 0 }
  }

  const approved = await classifyInParallel(candidates, query)
  const rejectedByClassifier = candidates.length - approved.length

  const accepted: Activity[] = []
  let failures = 0

  for (const { image, meta } of approved) {
    if (accepted.length >= need) break
    if (Date.now() > deadline) break
    try {
      const cleanedUrl = await replicateCleanImage(image.url)
      const { buffer, contentType } = await fetchBuffer(cleanedUrl)

      const activityId = randomUUID()
      const extension = contentType.split("/")[1] || "png"
      const imagePath = `tavily/${activityId}/activity.${extension}`

      const { error: uploadError } = await supabase.storage
        .from("activities")
        .upload(imagePath, buffer, { contentType, upsert: true })
      if (uploadError) throw uploadError

      const { data: row, error: insertError } = await supabase
        .from("activities")
        .insert({
          id: activityId,
          image_path: imagePath,
          image_media_type: contentType,
          title: meta.title,
          theme: meta.theme,
          short_description: meta.short_description,
          long_description: meta.long_description,
          bncc_codes: meta.bncc_codes,
          type: meta.type,
          source_url: image.url,
          source_provider: "tavily",
          quality_score: HIGH_QUALITY_SCORE,
        })
        .select("*")
        .single()
      if (insertError) throw insertError
      if (row) accepted.push(row as unknown as Activity)
    } catch (err) {
      failures++
      console.error("[external-enrichment] candidate failed:", (err as Error).message)
    }
  }

  return { accepted, inspected: candidates.length, rejected: rejectedByClassifier, failures }
}

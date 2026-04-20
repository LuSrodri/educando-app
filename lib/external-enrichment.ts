// Pipeline: when the internal directory yields fewer than N hits for a query,
// expand the query into PT-BR variants, pull image candidates from Tavily in
// parallel, dedupe by URL, classify each with GPT-5.4-nano in parallel, then
// clean the accepted ones with gpt-image-1.5 (images.edit) sequentially,
// upload to Supabase Storage, and insert into `activities`.

import { createServerClient } from "@/lib/supabase/server"
import { collectImageCandidates, tavilySearchImages, type TavilyImage } from "@/lib/tavily"
import { classifyImageCandidate, type ClassifiedImage } from "@/lib/openai-classifier"
import { isEditableImageUrl, openaiCleanImage } from "@/lib/openai-image"
import { expandQuery } from "@/lib/query-expansion"
import type { Activity } from "@/lib/supabase/types"
import { randomUUID } from "node:crypto"

export interface EnrichmentResult {
  accepted: Activity[]
  inspected: number
  rejected: number
  failures: number
}

// Only "high" reaches ingestion. Anything below is discarded before we spend
// gpt-image-1.5 budget on it, so every row stored via Tavily has quality_score 0.9.
const MIN_ACCEPTED_QUALITY: ClassifiedImage["quality"] = "high"
const HIGH_QUALITY_SCORE = 0.9
const TAVILY_PER_QUERY = 20
const DEFAULT_POOL_CAP = 30

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
    (c) =>
      c.meta.usable &&
      c.meta.portrait &&
      c.meta.self_sufficient &&
      c.meta.quality === MIN_ACCEPTED_QUALITY,
  )
}

export async function enrichFromTavily(
  query: string,
  need: number,
  options: { maxCandidates?: number; overallDeadlineMs?: number } = {},
): Promise<EnrichmentResult> {
  const supabase = createServerClient()
  const cap = Math.min(options.maxCandidates ?? DEFAULT_POOL_CAP, 60)
  const deadline = Date.now() + (options.overallDeadlineMs ?? 180_000)

  const variants = await expandQuery(query)
  const searches = await Promise.allSettled(
    variants.map((v) => tavilySearchImages(v, { maxResults: TAVILY_PER_QUERY })),
  )

  const seen = new Set<string>()
  const candidates: TavilyImage[] = []
  for (const r of searches) {
    if (r.status !== "fulfilled") continue
    for (const img of collectImageCandidates(r.value)) {
      if (seen.has(img.url)) continue
      seen.add(img.url)
      if (!isEditableImageUrl(img.url)) continue
      candidates.push(img)
      if (candidates.length >= cap) break
    }
    if (candidates.length >= cap) break
  }

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
      const { buffer, contentType } = await openaiCleanImage(image.url)

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

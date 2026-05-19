import { NextResponse } from "next/server"
import OpenAI from "openai"
import { createServerClient } from "@/lib/supabase/server"
import { randomUUID } from "node:crypto"
import { generateSpec, generateImage } from "@/lib/generation"

export const maxDuration = 600
export const dynamic = "force-dynamic"

const MAX_TOPICS = 3
const MIN_COVERAGE_THRESHOLD = 2

interface TopicResult {
  query: string
  id?: string
  error?: string
}

// ─── Per-topic pipeline ───────────────────────────────────────────────────────

async function processTopic(
  query: string,
  openai: OpenAI,
  supabase: ReturnType<typeof createServerClient>,
): Promise<TopicResult> {
  try {
    // Skip if already have sufficient coverage (idempotency for duplicate cron events).
    // We escape SQL LIKE wildcards. We do NOT use .or() because its filter syntax
    // separates conditions with commas — a comma in the query value would break it.
    const sanitized = query.replace(/[%_\\]/g, "\\$&")
    const { count } = await supabase
      .from("activities")
      .select("id", { count: "exact", head: true })
      .ilike("theme", `%${sanitized}%`)

    if ((count ?? 0) >= MIN_COVERAGE_THRESHOLD) {
      return { query, error: "skip_sufficient_coverage" }
    }

    // Generate activity spec (model uses its own web_search tool internally)
    const spec = await generateSpec(query, openai)

    // Generate worksheet image
    const imageBuffer = await generateImage(spec.image_prompt, openai)

    // Upload to Supabase Storage
    const activityId = randomUUID()
    const imagePath = `internal/${activityId}/activity.png`

    const { error: uploadError } = await supabase.storage
      .from("activities")
      .upload(imagePath, imageBuffer, { contentType: "image/png", upsert: true })
    if (uploadError) throw new Error(`upload_failed: ${uploadError.message}`)

    // Insert activity record
    const { data: row, error: insertError } = await supabase
      .from("activities")
      .insert({
        id: activityId,
        image_path: imagePath,
        image_media_type: "image/png",
        title: spec.title,
        theme: spec.theme,
        short_description: spec.short_description,
        long_description: spec.long_description,
        bncc_codes: spec.bncc_codes,
        type: spec.type,
        source_url: null,
        source_provider: "internal",
        quality_score: 0.9,
      })
      .select("id")
      .single()
    if (insertError) throw new Error(`insert_failed: ${insertError.message}`)

    console.log(`[weekly-activities] ✓ "${spec.title}" → ${row?.id}`)
    return { query, id: row?.id }
  } catch (err) {
    const message = (err as Error).message
    console.error(`[weekly-activities] ✗ "${query}" — ${message}`)
    return { query, error: message }
  }
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function GET(req: Request) {
  // Verify Vercel cron secret
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret || req.headers.get("authorization") !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  }

  const openaiKey = process.env.OPENAI_API_KEY!
  if (!openaiKey) {
    return NextResponse.json({ error: "missing_env_vars" }, { status: 500 })
  }

  const openai = new OpenAI({ apiKey: openaiKey })
  const supabase = createServerClient()

  // Fetch top under-served search queries from the past 7 days
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const { data: rows, error: queryError } = await supabase
    .from("search_queries")
    .select("normalized_query")
    .eq("outcome", "ok")
    .lt("results_count", 5)
    .gte("created_at", since)
    .not("normalized_query", "is", null)

  if (queryError) {
    return NextResponse.json({ error: `db_query_failed: ${queryError.message}` }, { status: 500 })
  }

  if (!rows?.length) {
    return NextResponse.json({ message: "no_under_served_searches", generated: 0 })
  }

  // Rank by frequency
  const freq = new Map<string, number>()
  for (const { normalized_query } of rows) {
    if (normalized_query && normalized_query.length > 3) {
      freq.set(normalized_query, (freq.get(normalized_query) ?? 0) + 1)
    }
  }
  const topTerms = [...freq.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, MAX_TOPICS)
    .map(([q]) => q)

  console.log(`[weekly-activities] Processing ${topTerms.length} topics:`, topTerms)

  // Process all topics in parallel
  const results = await Promise.all(
    topTerms.map((query) => processTopic(query, openai, supabase))
  )

  const generated = results.filter((r) => r.id)
  const skipped = results.filter((r) => r.error === "skip_sufficient_coverage")
  const failed = results.filter(
    (r) => r.error && r.error !== "skip_sufficient_coverage",
  )

  return NextResponse.json({
    generated: generated.length,
    failed: failed.length,
    skipped: skipped.length,
    results,
  })
}

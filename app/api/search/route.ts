import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { enrichFromTavily } from "@/lib/external-enrichment"
import { rateLimit } from "@/lib/rate-limit"
import { verifyTurnstileToken } from "@/lib/turnstile"
import { moderateSearchQuery } from "@/lib/moderation"
import { extractClientIp } from "@/lib/client-ip"
import type { Activity } from "@/lib/supabase/types"

export const runtime = "nodejs"
// Pipeline de enriquecimento tem deadline interno de 180s; somamos margem para
// FTS, moderação, rate-limit e a query final pós-ingestão. Vercel Pro permite
// até 300s; ajustar plano se cair em 504.
export const maxDuration = 240

const DEFAULT_PAGE_SIZE = 24
const MAX_PAGE_SIZE = 60
const MIN_RESULTS_THRESHOLD = 5
const MAX_ENRICHMENT = 5

const SEARCH_LIMIT_PER_MIN = 30
const ENRICHMENT_LIMIT_PER_HOUR = 10

type SearchPayload = { data: Activity[]; total: number }

type Outcome =
  | "ok"
  | "search_rate_limited"
  | "moderation_rejected"
  | "turnstile_failed"
  | "enrichment_rate_limited"
  | "error"

interface TelemetryRow {
  query: string
  normalized_query: string
  page: number
  results_count: number | null
  external_fetched: number | null
  outcome: Outcome
  moderation_reason: string | null
  enrichment_triggered: boolean
  candidates_inspected: number | null
  candidates_rejected: number | null
  candidates_failed: number | null
  duration_ms: number
}

function normalizeQuery(q: string): string {
  return q
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim()
}

function unauthorized(reason: string) {
  return NextResponse.json({ error: "unauthorized", reason }, { status: 401 })
}

function tooMany() {
  return NextResponse.json({ error: "rate_limited" }, { status: 429 })
}

async function recordTelemetry(row: TelemetryRow): Promise<void> {
  if (row.query.length === 0) return
  const { error } = await createServerClient()
    .from("search_queries")
    .insert(row)
  if (error) console.error("[api/search] telemetry insert failed:", error.message)
}

export async function GET(request: NextRequest) {
  const start = Date.now()
  const { searchParams } = request.nextUrl
  const q = (searchParams.get("q") ?? "").trim()
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10))
  const limit = Math.min(
    parseInt(searchParams.get("limit") || String(DEFAULT_PAGE_SIZE), 10),
    MAX_PAGE_SIZE,
  )
  const offset = (page - 1) * limit
  const turnstileToken = request.headers.get("x-cf-turnstile-token")
  const ip = extractClientIp(request)
  const rateKey = ip ?? "anon"

  const base = {
    query: q,
    normalized_query: normalizeQuery(q),
    page,
    moderation_reason: null as string | null,
    enrichment_triggered: false,
    candidates_inspected: null as number | null,
    candidates_rejected: null as number | null,
    candidates_failed: null as number | null,
  }

  const allowed = await rateLimit("search", rateKey, SEARCH_LIMIT_PER_MIN, 60)
  if (!allowed) {
    await recordTelemetry({
      ...base,
      results_count: null,
      external_fetched: null,
      outcome: "search_rate_limited",
      duration_ms: Date.now() - start,
    })
    return tooMany()
  }

  if (q.length > 0) {
    const moderation = await moderateSearchQuery(q)
    if (!moderation.accept) {
      await recordTelemetry({
        ...base,
        moderation_reason: moderation.reason,
        results_count: null,
        external_fetched: null,
        outcome: "moderation_rejected",
        duration_ms: Date.now() - start,
      })
      return unauthorized(`query_${moderation.reason}`)
    }
  }

  const supabase = createServerClient()
  try {
    const { data: initial, error: initialError } = await supabase.rpc("search_activities", {
      q,
      p_limit: limit,
      p_offset: offset,
    })
    if (initialError) throw initialError

    const parsed = (initial ?? { data: [], total: 0 }) as SearchPayload
    let payload = parsed
    let externalFetched = 0
    let enrichmentTriggered = false
    let candidatesInspected: number | null = null
    let candidatesRejected: number | null = null
    let candidatesFailed: number | null = null

    const shouldEnrich =
      q.length > 0 && page === 1 && parsed.total < MIN_RESULTS_THRESHOLD
    if (shouldEnrich) {
      const tokenOk = await verifyTurnstileToken(turnstileToken, ip)
      if (!tokenOk) {
        await recordTelemetry({
          ...base,
          results_count: parsed.total,
          external_fetched: 0,
          outcome: "turnstile_failed",
          duration_ms: Date.now() - start,
        })
        return unauthorized("turnstile_required")
      }
      const enrichmentAllowed = await rateLimit(
        "enrichment",
        rateKey,
        ENRICHMENT_LIMIT_PER_HOUR,
        3600,
      )
      if (!enrichmentAllowed) {
        await recordTelemetry({
          ...base,
          results_count: parsed.total,
          external_fetched: 0,
          outcome: "enrichment_rate_limited",
          duration_ms: Date.now() - start,
        })
        return tooMany()
      }

      enrichmentTriggered = true
      try {
        const need = Math.max(0, MAX_ENRICHMENT - parsed.total)
        const enrichment = await enrichFromTavily(q, need)
        externalFetched = enrichment.accepted.length
        candidatesInspected = enrichment.inspected
        candidatesRejected = enrichment.rejected
        candidatesFailed = enrichment.failures

        if (externalFetched > 0) {
          const { data: refreshed, error: refreshedError } = await supabase.rpc(
            "search_activities",
            { q, p_limit: limit, p_offset: offset },
          )
          if (refreshedError) throw refreshedError
          payload = (refreshed ?? parsed) as SearchPayload
        }
      } catch (enrichError) {
        console.error("[api/search] enrichment failed:", (enrichError as Error).message)
      }
    }

    if (q.length > 0) {
      supabase
        .from("search_queries")
        .insert({
          ...base,
          results_count: payload.total,
          external_fetched: externalFetched,
          outcome: "ok",
          enrichment_triggered: enrichmentTriggered,
          candidates_inspected: candidatesInspected,
          candidates_rejected: candidatesRejected,
          candidates_failed: candidatesFailed,
          duration_ms: Date.now() - start,
        })
        .then(({ error }) => {
          if (error) console.error("[api/search] telemetry insert failed:", error.message)
        })
    }

    return NextResponse.json({
      data: payload.data,
      total: payload.total,
      page,
      limit,
      query: q,
      external_fetched: externalFetched,
    })
  } catch (error) {
    console.error("[api/search] failure:", error)
    await recordTelemetry({
      ...base,
      results_count: null,
      external_fetched: null,
      outcome: "error",
      duration_ms: Date.now() - start,
    })
    return NextResponse.json({ error: "search_failed" }, { status: 500 })
  }
}

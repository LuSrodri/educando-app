import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { rateLimit } from "@/lib/rate-limit"
import { quickReject, moderateSearchQuery } from "@/lib/moderation"
import { extractClientIp } from "@/lib/client-ip"
import type { Activity } from "@/lib/supabase/types"

export const runtime = "nodejs"
export const maxDuration = 30

const DEFAULT_PAGE_SIZE = 24
const MAX_PAGE_SIZE = 60
const SEARCH_LIMIT_PER_MIN = 30

type SearchPayload = { data: Activity[]; total: number }

function normalizeQuery(q: string): string {
  return q
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim()
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
  const ip = extractClientIp(request)
  const rateKey = ip ?? "anon"

  if (q.length > 0) {
    const quick = quickReject(q)
    if (!quick.accept) {
      return NextResponse.json(
        { error: "unauthorized", reason: `query_${quick.reason}` },
        { status: 401 },
      )
    }
  }

  const allowed = await rateLimit("search", rateKey, SEARCH_LIMIT_PER_MIN, 60)
  if (!allowed) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 })
  }

  if (q.length > 0) {
    const moderation = await moderateSearchQuery(q)
    if (!moderation.accept) {
      return NextResponse.json(
        { error: "unauthorized", reason: `query_${moderation.reason}` },
        { status: 401 },
      )
    }
  }

  const supabase = createServerClient()
  const { data: initial, error: initialError } = await supabase.rpc("search_activities", {
    q,
    p_limit: limit,
    p_offset: offset,
  })
  if (initialError) {
    console.error("[api/search] failure:", initialError)
    return NextResponse.json({ error: "search_failed" }, { status: 500 })
  }

  const payload = (initial ?? { data: [], total: 0 }) as SearchPayload

  if (q.length > 0) {
    const { error: telemetryError } = await supabase.from("search_queries").insert({
      query: q,
      normalized_query: normalizeQuery(q),
      page,
      results_count: payload.total,
      external_fetched: 0,
      outcome: "ok",
      moderation_reason: null,
      enrichment_triggered: false,
      candidates_inspected: null,
      candidates_rejected: null,
      candidates_failed: null,
      duration_ms: Date.now() - start,
    })
    if (telemetryError) {
      console.error("[api/search] telemetry insert failed:", telemetryError.message)
    }
  }

  return NextResponse.json({
    data: payload.data,
    total: payload.total,
    page,
    limit,
    query: q,
    external_fetched: 0,
  })
}

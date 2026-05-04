import { NextRequest, NextResponse, after } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { rateLimit } from "@/lib/rate-limit"
import { verifyTurnstileToken } from "@/lib/turnstile"
import { quickReject, moderateSearchQuery } from "@/lib/moderation"
import { extractClientIp } from "@/lib/client-ip"
import type { Activity } from "@/lib/supabase/types"

export const runtime = "nodejs"
export const maxDuration = 30

const DEFAULT_PAGE_SIZE = 24
const MAX_PAGE_SIZE = 60
const SEARCH_LIMIT_PER_MIN = 30

type SearchPayload = { data: Activity[]; total: number }

type Outcome =
  | "ok"
  | "search_rate_limited"
  | "moderation_rejected"
  | "turnstile_failed"
  | "error"

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
  const normalizedQ = normalizeQuery(q)

  // Quick synchronous reject — no external calls, <1 ms
  if (q.length > 0) {
    const quick = quickReject(q)
    if (!quick.accept) {
      await createServerClient()
        .from("search_queries")
        .insert({
          query: q,
          normalized_query: normalizedQ,
          page,
          results_count: null,
          external_fetched: null,
          outcome: "moderation_rejected" as Outcome,
          moderation_reason: quick.reason,
          enrichment_triggered: false,
          candidates_inspected: null,
          candidates_rejected: null,
          candidates_failed: null,
          duration_ms: Date.now() - start,
        })
      return unauthorized(`query_${quick.reason}`)
    }
  }

  const allowed = await rateLimit("search", rateKey, SEARCH_LIMIT_PER_MIN, 60)
  if (!allowed) {
    if (q.length > 0) {
      await createServerClient()
        .from("search_queries")
        .insert({
          query: q,
          normalized_query: normalizedQ,
          page,
          results_count: null,
          external_fetched: null,
          outcome: "search_rate_limited" as Outcome,
          moderation_reason: null,
          enrichment_triggered: false,
          candidates_inspected: null,
          candidates_rejected: null,
          candidates_failed: null,
          duration_ms: Date.now() - start,
        })
    }
    return tooMany()
  }

  const supabase = createServerClient()
  try {
    const { data: initial, error: initialError } = await supabase.rpc("search_activities", {
      q,
      p_limit: limit,
      p_offset: offset,
    })
    if (initialError) throw initialError

    const payload = (initial ?? { data: [], total: 0 }) as SearchPayload
    const resultsCount = payload.total

    // Background: moderate → verify turnstile → insert telemetry.
    // Runs after the response is sent; never blocks the user.
    // Only telemetry rows with outcome="ok" are consumed by the weekly cron.
    if (q.length > 0) {
      after(async () => {
        const moderation = await moderateSearchQuery(q)
        if (!moderation.accept) {
          await createServerClient()
            .from("search_queries")
            .insert({
              query: q,
              normalized_query: normalizedQ,
              page,
              results_count: resultsCount,
              external_fetched: 0,
              outcome: "moderation_rejected" as Outcome,
              moderation_reason: moderation.reason,
              enrichment_triggered: false,
              candidates_inspected: null,
              candidates_rejected: null,
              candidates_failed: null,
              duration_ms: Date.now() - start,
            })
          return
        }

        const tokenOk = await verifyTurnstileToken(turnstileToken, ip)
        if (!tokenOk) {
          await createServerClient()
            .from("search_queries")
            .insert({
              query: q,
              normalized_query: normalizedQ,
              page,
              results_count: resultsCount,
              external_fetched: 0,
              outcome: "turnstile_failed" as Outcome,
              moderation_reason: null,
              enrichment_triggered: false,
              candidates_inspected: null,
              candidates_rejected: null,
              candidates_failed: null,
              duration_ms: Date.now() - start,
            })
          return
        }

        const { error } = await createServerClient()
          .from("search_queries")
          .insert({
            query: q,
            normalized_query: normalizedQ,
            page,
            results_count: resultsCount,
            external_fetched: 0,
            outcome: "ok" as Outcome,
            moderation_reason: null,
            enrichment_triggered: false,
            candidates_inspected: null,
            candidates_rejected: null,
            candidates_failed: null,
            duration_ms: Date.now() - start,
          })
        if (error) console.error("[api/search] telemetry insert failed:", error.message)
      })
    }

    return NextResponse.json({
      data: payload.data,
      total: payload.total,
      page,
      limit,
      query: q,
      external_fetched: 0,
    })
  } catch (error) {
    console.error("[api/search] failure:", error)
    if (q.length > 0) {
      await createServerClient()
        .from("search_queries")
        .insert({
          query: q,
          normalized_query: normalizedQ,
          page,
          results_count: null,
          external_fetched: null,
          outcome: "error" as Outcome,
          moderation_reason: null,
          enrichment_triggered: false,
          candidates_inspected: null,
          candidates_rejected: null,
          candidates_failed: null,
          duration_ms: Date.now() - start,
        })
    }
    return NextResponse.json({ error: "search_failed" }, { status: 500 })
  }
}

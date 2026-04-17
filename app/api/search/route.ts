import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { enrichFromTavily } from "@/lib/external-enrichment"
import { resolveIdentity } from "@/lib/identity"
import { rateLimit } from "@/lib/rate-limit"
import { verifyTurnstileToken } from "@/lib/turnstile"
import type { Activity } from "@/lib/supabase/types"

export const runtime = "nodejs"
export const maxDuration = 120

const DEFAULT_PAGE_SIZE = 24
const MAX_PAGE_SIZE = 60
const MIN_RESULTS_THRESHOLD = 5
const MAX_ENRICHMENT = 5

// Rate limits (per fingerprint_hash).
const SEARCH_LIMIT_PER_MIN = 30
const ENRICHMENT_LIMIT_PER_HOUR = 10

type SearchPayload = { data: Activity[]; total: number }

function normalizeQuery(q: string): string {
  return q
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
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
  const { searchParams } = request.nextUrl
  const q = (searchParams.get("q") ?? "").trim()
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10))
  const limit = Math.min(
    parseInt(searchParams.get("limit") || String(DEFAULT_PAGE_SIZE), 10),
    MAX_PAGE_SIZE,
  )
  const offset = (page - 1) * limit
  const turnstileToken = request.headers.get("x-cf-turnstile-token")

  const identity = await resolveIdentity(request)
  if (identity.isFraud) return unauthorized("fraud_detected")

  const rateKey = identity.fingerprintHash ?? identity.ip ?? "anon"
  const allowed = await rateLimit("search", rateKey, SEARCH_LIMIT_PER_MIN, 60)
  if (!allowed) return tooMany()

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

    const shouldEnrich =
      q.length > 0 && page === 1 && parsed.total < MIN_RESULTS_THRESHOLD
    if (shouldEnrich) {
      // Enrichment is expensive — require a valid Turnstile token and an extra
      // hourly budget per fingerprint to prevent wallet attacks.
      const tokenOk = await verifyTurnstileToken(turnstileToken, identity.ip)
      if (!tokenOk) return unauthorized("turnstile_required")
      const enrichmentAllowed = await rateLimit(
        "enrichment",
        rateKey,
        ENRICHMENT_LIMIT_PER_HOUR,
        3600,
      )
      if (!enrichmentAllowed) return tooMany()

      try {
        const need = Math.max(0, MAX_ENRICHMENT - parsed.total)
        const enrichment = await enrichFromTavily(q, need)
        externalFetched = enrichment.accepted.length

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

    // Telemetry — fire-and-forget.
    supabase
      .from("search_queries")
      .insert({
        query: q,
        normalized_query: normalizeQuery(q),
        fingerprint_hash: identity.fingerprintHash,
        results_count: payload.total,
        external_fetched: externalFetched,
      })
      .then(({ error }) => {
        if (error) console.error("[api/search] telemetry insert failed:", error.message)
      })

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
    return NextResponse.json({ error: "search_failed" }, { status: 500 })
  }
}

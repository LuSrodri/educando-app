import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { resolveIdentity } from "@/lib/identity"
import { rateLimit } from "@/lib/rate-limit"

// Records a click. Accepts JSON {activityId, referrer, fpId}. fpId arrives in
// the body because clicks are posted via navigator.sendBeacon, which cannot
// set custom headers.

const CLICK_LIMIT_PER_MIN = 120

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => ({}))) as {
      activityId?: string
      referrer?: string
      fpId?: string
    }
    const activityId = body.activityId
    if (!activityId || typeof activityId !== "string") {
      return NextResponse.json({ error: "activityId required" }, { status: 400 })
    }

    const identity = await resolveIdentity(request, body.fpId ?? null)
    if (identity.isFraud) {
      return new NextResponse(null, { status: 401 })
    }

    const rateKey = identity.fingerprintHash ?? identity.ip ?? "anon"
    const allowed = await rateLimit("click", rateKey, CLICK_LIMIT_PER_MIN, 60)
    if (!allowed) return new NextResponse(null, { status: 429 })

    const supabase = createServerClient()
    const { error } = await supabase.from("activity_clicks").insert({
      activity_id: activityId,
      fingerprint_hash: identity.fingerprintHash,
      referrer: body.referrer?.slice(0, 300) ?? null,
    })
    if (error) console.error("[api/telemetry/click] insert failed:", error.message)
    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error("[api/telemetry/click] failure:", error)
    return new NextResponse(null, { status: 204 })
  }
}

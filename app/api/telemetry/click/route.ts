import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { rateLimit } from "@/lib/rate-limit"
import { extractClientIp } from "@/lib/client-ip"

const CLICK_LIMIT_PER_MIN = 120

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => ({}))) as {
      activityId?: string
      referrer?: string
    }
    const activityId = body.activityId
    const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!activityId || typeof activityId !== "string" || !UUID_RE.test(activityId)) {
      return NextResponse.json({ error: "activityId required" }, { status: 400 })
    }

    const ip = extractClientIp(request)
    const rateKey = ip ?? "anon"
    const allowed = await rateLimit("click", rateKey, CLICK_LIMIT_PER_MIN, 60)
    if (!allowed) return new NextResponse(null, { status: 429 })

    const supabase = createServerClient()
    const { error } = await supabase.from("activity_clicks").insert({
      activity_id: activityId,
      referrer: body.referrer?.slice(0, 300) ?? null,
    })
    if (error) console.error("[api/telemetry/click] insert failed:", error.message)
    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error("[api/telemetry/click] failure:", error)
    return new NextResponse(null, { status: 204 })
  }
}

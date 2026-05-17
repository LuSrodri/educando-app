import { NextResponse, type NextRequest } from "next/server"
import { createSSRServerClient, getCurrentUser } from "@/lib/supabase/ssr-server"
import { getSubscriptionState } from "@/lib/subscriptions"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

async function readActivityId(request: NextRequest): Promise<string | null> {
  try {
    const body = (await request.json()) as { activityId?: unknown }
    if (typeof body.activityId === "string" && body.activityId.length > 0) {
      return body.activityId
    }
  } catch {
    // fall through to query string
  }
  const fromQuery = request.nextUrl.searchParams.get("activityId")
  return fromQuery && fromQuery.length > 0 ? fromQuery : null
}

async function requirePremium(): Promise<
  | { ok: true; userId: string; supabase: Awaited<ReturnType<typeof createSSRServerClient>> }
  | { ok: false; response: NextResponse }
> {
  const user = await getCurrentUser()
  if (!user) {
    return {
      ok: false,
      response: NextResponse.json({ error: "unauthorized" }, { status: 401 }),
    }
  }
  const supabase = await createSSRServerClient()
  const { isPremium } = await getSubscriptionState(supabase, user.id)
  if (!isPremium) {
    return {
      ok: false,
      response: NextResponse.json({ error: "premium_required" }, { status: 403 }),
    }
  }
  return { ok: true, userId: user.id, supabase }
}

export async function POST(request: NextRequest) {
  const gate = await requirePremium()
  if (!gate.ok) return gate.response

  const activityId = await readActivityId(request)
  if (!activityId) {
    return NextResponse.json({ error: "missing_activity_id" }, { status: 400 })
  }

  const { error } = await gate.supabase
    .from("saved_activities")
    .insert({ user_id: gate.userId, activity_id: activityId })

  if (error && error.code !== "23505") {
    // 23505 = duplicate → já salvo, ok.
    console.error("[salvar] insert error:", error.message)
    return NextResponse.json({ error: "db_error" }, { status: 500 })
  }

  return NextResponse.json({ ok: true, saved: true })
}

export async function DELETE(request: NextRequest) {
  const gate = await requirePremium()
  if (!gate.ok) return gate.response

  const activityId = await readActivityId(request)
  if (!activityId) {
    return NextResponse.json({ error: "missing_activity_id" }, { status: 400 })
  }

  const { error } = await gate.supabase
    .from("saved_activities")
    .delete()
    .eq("user_id", gate.userId)
    .eq("activity_id", activityId)

  if (error) {
    console.error("[salvar] delete error:", error.message)
    return NextResponse.json({ error: "db_error" }, { status: 500 })
  }

  return NextResponse.json({ ok: true, saved: false })
}

import { NextResponse, type NextRequest } from "next/server"
import { getStripe } from "@/lib/stripe"
import { createServerClient as createSupabaseAdmin } from "@/lib/supabase/server"
import { getCurrentUser } from "@/lib/supabase/ssr-server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * Desfaz um cancelamento agendado (cancel_at_period_end=true). Só funciona
 * enquanto a Subscription ainda está active/trialing/past_due — após canceled
 * o usuário precisa criar uma nova.
 */
export async function POST(_request: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 })

  const admin = createSupabaseAdmin()
  const { data: sub } = await admin
    .from("subscriptions")
    .select("stripe_subscription_id, status, cancel_at_period_end")
    .eq("user_id", user.id)
    .in("status", ["active", "trialing", "past_due"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!sub) {
    return NextResponse.json({ error: "no_active_subscription" }, { status: 404 })
  }
  if (!sub.cancel_at_period_end) {
    return NextResponse.json({ ok: true, alreadyActive: true })
  }

  try {
    await getStripe().subscriptions.update(sub.stripe_subscription_id, {
      cancel_at_period_end: false,
    })
  } catch (err) {
    console.error("[assinatura/reativar] stripe error:", (err as Error).message)
    return NextResponse.json({ error: "stripe_error" }, { status: 502 })
  }

  await admin
    .from("subscriptions")
    .update({ cancel_at_period_end: false })
    .eq("stripe_subscription_id", sub.stripe_subscription_id)

  return NextResponse.json({ ok: true })
}

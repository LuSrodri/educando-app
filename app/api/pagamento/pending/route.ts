import { NextResponse } from "next/server"
import { getCurrentUser, createSSRServerClient } from "@/lib/supabase/ssr-server"
import { getStripe } from "@/lib/stripe"

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 })

  const supabase = await createSSRServerClient()
  const { data } = await supabase
    .from("payment_intents")
    .select("id, stripe_payment_intent_id, expires_at")
    .eq("user_id", user.id)
    .eq("status", "pending")
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!data || !data.stripe_payment_intent_id) {
    return NextResponse.json({ pending: null })
  }

  const stripe = getStripe()
  try {
    const intent = await stripe.paymentIntents.retrieve(data.stripe_payment_intent_id)
    const qr = intent.next_action?.pix_display_qr_code as
      | { data?: string; image_url_svg?: string; image_url_png?: string }
      | undefined

    const response = NextResponse.json({
      pending: {
        paymentId: data.id,
        qrImageUrl: qr?.image_url_svg ?? qr?.image_url_png ?? "",
        qrText: qr?.data ?? "",
        expiresAt: data.expires_at,
      },
    })
    response.headers.set("Cache-Control", "no-store")
    return response
  } catch {
    return NextResponse.json({ pending: null })
  }
}

import { createServerClient } from "@/lib/supabase/server"
import { validateWebhookSignature } from "@/lib/mercadopago"
import { grantPaidCredits } from "@/lib/paid-credits"

export async function POST(req: Request) {
  let rawBody: string
  try {
    rawBody = await req.text()
  } catch {
    return Response.json({ error: "Failed to read body" }, { status: 400 })
  }

  // Validate Mercado Pago HMAC signature
  if (!validateWebhookSignature(req.headers, rawBody)) {
    return Response.json({ error: "Invalid signature" }, { status: 401 })
  }

  let payload: any
  try {
    payload = JSON.parse(rawBody)
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 })
  }

  // Only handle payment notifications
  if (payload?.type !== "payment") {
    return Response.json({ received: true })
  }

  const mpPaymentId = payload?.data?.id
  if (!mpPaymentId) {
    return Response.json({ error: "Missing payment id" }, { status: 400 })
  }

  // Always verify payment status directly with MP API (never trust webhook body alone)
  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN
  if (!accessToken) {
    console.error("MERCADOPAGO_ACCESS_TOKEN not set")
    return Response.json({ error: "Server misconfigured" }, { status: 500 })
  }

  let mpPayment: any
  try {
    const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${mpPaymentId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    if (!mpRes.ok) {
      console.error("Failed to fetch MP payment:", await mpRes.text())
      return Response.json({ error: "Failed to verify payment" }, { status: 502 })
    }
    mpPayment = await mpRes.json()
  } catch (err) {
    console.error("Error fetching MP payment:", err)
    return Response.json({ error: "Failed to verify payment" }, { status: 502 })
  }

  if (mpPayment.status !== "approved") {
    // Update status in DB if it changed (e.g. rejected/cancelled)
    const supabase = createServerClient()
    const mapped =
      mpPayment.status === "rejected"
        ? "rejected"
        : mpPayment.status === "cancelled"
          ? "cancelled"
          : null
    if (mapped) {
      await supabase
        .from("mercadopago_payments")
        .update({ status: mapped })
        .eq("mp_payment_id", Number(mpPaymentId))
    }
    return Response.json({ received: true })
  }

  // Payment is approved — check idempotency
  const supabase = createServerClient()
  const { data: payment } = await supabase
    .from("mercadopago_payments")
    .select("id, browser_id, credits_to_grant, status")
    .eq("mp_payment_id", Number(mpPaymentId))
    .single()

  if (!payment) {
    console.error("Payment not found in DB for mp_payment_id:", mpPaymentId)
    return Response.json({ received: true })
  }

  if (payment.status === "approved") {
    // Already credited — idempotent response
    return Response.json({ received: true })
  }

  // Grant credits and mark approved
  try {
    await grantPaidCredits(payment.browser_id, payment.credits_to_grant)

    await supabase
      .from("mercadopago_payments")
      .update({
        status: "approved",
        approved_at: new Date().toISOString(),
      })
      .eq("id", payment.id)
  } catch (err) {
    console.error("Error granting paid credits from webhook:", err)
    return Response.json({ error: "Failed to grant credits" }, { status: 500 })
  }

  return Response.json({ received: true })
}

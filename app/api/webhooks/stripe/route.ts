import { NextResponse, type NextRequest } from "next/server"
import type Stripe from "stripe"
import { getStripe } from "@/lib/stripe"
import { syncSubscriptionToDb } from "@/lib/stripe-subscription-utils"
import { createServerClient as createSupabaseAdmin } from "@/lib/supabase/server"

// Webhook precisa do body raw pra verificar assinatura — desativa parsing.
export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const CREDIT_VALIDITY_MONTHS = 12

function addMonths(date: Date, months: number): Date {
  const next = new Date(date)
  next.setMonth(next.getMonth() + months)
  return next
}

async function handlePaymentSucceeded(
  pi: Stripe.PaymentIntent,
  admin: ReturnType<typeof createSupabaseAdmin>,
) {
  const userId = pi.metadata?.user_id
  const packCode = pi.metadata?.pack_code
  const creditsAmount = pi.metadata?.credits_amount
    ? Number.parseInt(pi.metadata.credits_amount, 10)
    : NaN

  if (!userId || !packCode || !Number.isFinite(creditsAmount) || creditsAmount <= 0) {
    console.error("[stripe-webhook] missing/invalid metadata on PI", pi.id)
    return
  }

  // Atualiza o payment_intent. Idempotente — re-runs são no-op.
  const { data: payment, error: updateErr } = await admin
    .from("payment_intents")
    .update({
      status: "paid",
      paid_at: new Date().toISOString(),
    })
    .eq("stripe_payment_intent_id", pi.id)
    .select("id")
    .single()

  if (updateErr || !payment) {
    console.error("[stripe-webhook] failed to update payment_intent", pi.id, updateErr?.message)
    return
  }

  // Crédito no ledger. Unique partial index garante idempotência:
  // se já existe purchase com esse payment_intent_id, o INSERT falha
  // com unique violation (silenciamos).
  const expiresAt = addMonths(new Date(), CREDIT_VALIDITY_MONTHS).toISOString()
  const { error: ledgerErr } = await admin.from("credit_ledger").insert({
    user_id: userId,
    delta: creditsAmount,
    kind: "purchase",
    reason: `Pacote ${packCode}`,
    payment_intent_id: payment.id,
    expires_at: expiresAt,
  })

  if (ledgerErr) {
    if (ledgerErr.code === "23505") {
      // Duplicate key — webhook reentregue. OK.
      return
    }
    console.error("[stripe-webhook] ledger insert failed", payment.id, ledgerErr.message)
  }
}

async function handlePaymentFailed(
  pi: Stripe.PaymentIntent,
  status: "failed" | "canceled",
  admin: ReturnType<typeof createSupabaseAdmin>,
) {
  const { error } = await admin
    .from("payment_intents")
    .update({ status })
    .eq("stripe_payment_intent_id", pi.id)
  if (error) {
    console.error(`[stripe-webhook] failed to mark ${status}`, pi.id, error.message)
  }
}

async function handleInvoicePayment(
  invoice: Stripe.Invoice,
  paid: boolean,
  admin: ReturnType<typeof createSupabaseAdmin>,
) {
  // Renovação: Stripe gera nova invoice e cria nova PaymentIntent. Quando
  // a invoice é paga, o status da Subscription vira active e o período
  // avança. O evento customer.subscription.updated dispara a sync — não
  // precisamos duplicar aqui. Mas se a fatura falha, logamos.
  const subId =
    typeof (invoice as Stripe.Invoice & { subscription?: string | Stripe.Subscription }).subscription === "string"
      ? ((invoice as Stripe.Invoice & { subscription?: string }).subscription as string)
      : ((invoice as Stripe.Invoice & { subscription?: Stripe.Subscription }).subscription as Stripe.Subscription | undefined)?.id
  if (!subId) return

  if (!paid) {
    console.warn("[stripe-webhook] invoice.payment_failed for sub", subId)
  }
}

export async function POST(request: NextRequest) {
  const signature = request.headers.get("stripe-signature")
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!signature || !webhookSecret) {
    return NextResponse.json({ error: "missing_signature_or_secret" }, { status: 400 })
  }

  const rawBody = await request.text()
  const stripe = getStripe()

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret)
  } catch (err) {
    const message = err instanceof Error ? err.message : "invalid_signature"
    console.error("[stripe-webhook] signature verification failed:", message)
    return NextResponse.json({ error: "invalid_signature" }, { status: 400 })
  }

  const admin = createSupabaseAdmin()

  try {
    switch (event.type) {
      case "payment_intent.succeeded":
        await handlePaymentSucceeded(event.data.object, admin)
        break
      case "payment_intent.payment_failed":
        await handlePaymentFailed(event.data.object, "failed", admin)
        break
      case "payment_intent.canceled":
        await handlePaymentFailed(event.data.object, "canceled", admin)
        break

      // ─── Assinatura premium ────────────────────────────────────────────
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
      case "customer.subscription.paused":
      case "customer.subscription.resumed":
        await syncSubscriptionToDb(admin, event.data.object as Stripe.Subscription)
        break
      case "invoice.payment_succeeded":
        await handleInvoicePayment(event.data.object as Stripe.Invoice, true, admin)
        break
      case "invoice.payment_failed":
        await handleInvoicePayment(event.data.object as Stripe.Invoice, false, admin)
        break

      default:
        // Outros eventos chegam aqui mas não exigem ação — Stripe espera 200.
        break
    }
  } catch (err) {
    console.error("[stripe-webhook] handler error:", (err as Error).message)
    // Retorna 500 para Stripe re-tentar.
    return NextResponse.json({ error: "handler_error" }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}

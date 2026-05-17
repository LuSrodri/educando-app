import { NextResponse, type NextRequest } from "next/server"
import { getStripe } from "@/lib/stripe"
import { getPremiumMonthlyPriceId } from "@/lib/subscription-config"
import { createServerClient as createSupabaseAdmin } from "@/lib/supabase/server"
import { getCurrentUser } from "@/lib/supabase/ssr-server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * Cria uma Stripe Checkout Session em modo Embedded para assinatura.
 *
 * Diferente da abordagem anterior (Payment Element manual): aqui a Stripe
 * gerencia todo o UI do checkout (cartão, 3DS, errors, retries). A gente
 * só passa o priceId e o customerId e devolve o clientSecret pro front
 * montar o <EmbeddedCheckout />. A Subscription só é criada quando o
 * pagamento completa — e aí o webhook (`customer.subscription.created`)
 * sincroniza nossa tabela `subscriptions`.
 */
export async function POST(request: NextRequest) {
  const user = await getCurrentUser()
  if (!user || !user.email) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  }

  // Origin do request: localhost em dev, URL real em prod. Headers x-forwarded-*
  // são setados pelo Vercel/Next; cai pro origin direto quando ausentes.
  const proto = request.headers.get("x-forwarded-proto") ?? request.nextUrl.protocol.replace(":", "")
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? request.nextUrl.host
  const origin = `${proto}://${host}`

  const stripe = getStripe()
  const admin = createSupabaseAdmin()

  // ─── Defesa 1: checa no nosso DB ─────────────────────────────────────────
  const { data: existing } = await admin
    .from("subscriptions")
    .select("status")
    .eq("user_id", user.id)
    .in("status", ["active", "trialing", "past_due"])
    .limit(1)
    .maybeSingle()

  if (existing) {
    return NextResponse.json({ error: "already_subscribed" }, { status: 409 })
  }

  // ─── Stripe Customer (reaproveita se já existe) ─────────────────────────
  const { data: profile } = await admin
    .from("profiles")
    .select("stripe_customer_id, full_name")
    .eq("id", user.id)
    .maybeSingle()

  let customerId = profile?.stripe_customer_id ?? null
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      name:
        profile?.full_name ??
        (user.user_metadata?.full_name as string | undefined) ??
        undefined,
      metadata: { user_id: user.id },
    })
    customerId = customer.id
    await admin
      .from("profiles")
      .update({ stripe_customer_id: customerId })
      .eq("id", user.id)
  }

  // ─── Defesa 2: checa na própria Stripe ───────────────────────────────────
  // Cobre o caso onde o webhook nunca chegou (rede, deploy, etc) e nosso DB
  // não sabe que o customer já tem sub ativa. Sem isso, o usuário poderia ser
  // cobrado em duplicidade.
  try {
    const liveSubs = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
    })
    if (liveSubs.data.length > 0) {
      console.warn(
        "[assinatura/criar] Stripe tem sub active mas DB local não — webhook dessincronizado?",
        liveSubs.data[0].id,
      )
      return NextResponse.json({ error: "already_subscribed" }, { status: 409 })
    }
    const trialingSubs = await stripe.subscriptions.list({
      customer: customerId,
      status: "trialing",
      limit: 1,
    })
    if (trialingSubs.data.length > 0) {
      return NextResponse.json({ error: "already_subscribed" }, { status: 409 })
    }
    const pastDueSubs = await stripe.subscriptions.list({
      customer: customerId,
      status: "past_due",
      limit: 1,
    })
    if (pastDueSubs.data.length > 0) {
      return NextResponse.json({ error: "already_subscribed" }, { status: 409 })
    }
  } catch (err) {
    // Se a Stripe falhar a listagem, prefere não criar uma Checkout Session
    // do que arriscar duplicar cobrança.
    console.error("[assinatura/criar] stripe list error:", (err as Error).message)
    return NextResponse.json({ error: "stripe_error" }, { status: 502 })
  }

  // ─── Checkout Session embedded ──────────────────────────────────────────
  // user_id no subscription_data.metadata é essencial — o webhook
  // syncSubscription procura por essa key.
  try {
    const session = await stripe.checkout.sessions.create({
      ui_mode: "embedded_page",
      mode: "subscription",
      customer: customerId,
      payment_method_types: ["card"],
      line_items: [{ price: getPremiumMonthlyPriceId(), quantity: 1 }],
      return_url: `${origin}/minha-conta?assinatura=ativada&session_id={CHECKOUT_SESSION_ID}`,
      locale: "pt-BR",
      subscription_data: {
        metadata: { user_id: user.id, plan: "premium-monthly" },
      },
      metadata: { user_id: user.id },
    })

    if (!session.client_secret) {
      console.error("[assinatura/criar] no client_secret on session", session.id)
      return NextResponse.json({ error: "stripe_no_client_secret" }, { status: 502 })
    }

    return NextResponse.json({ clientSecret: session.client_secret })
  } catch (err) {
    console.error("[assinatura/criar] stripe error:", (err as Error).message)
    return NextResponse.json({ error: "stripe_error" }, { status: 502 })
  }
}

import type Stripe from "stripe"
import { PREMIUM_MONTHLY } from "@/lib/subscription-config"
import type { createServerClient } from "@/lib/supabase/server"
import type { SubscriptionStatus } from "@/lib/supabase/types"

/**
 * Na API "Dahlia" (2026-04-22) current_period_start/end migraram do nível
 * Subscription para SubscriptionItem. Esse helper lê do item primário e
 * converte unix → ISO. Retorna { start, end } com null quando o item ainda
 * não tem período (sub recém-criada antes de invoice).
 */
export function extractCurrentPeriod(sub: Stripe.Subscription): {
  startIso: string | null
  endIso: string | null
} {
  const item = sub.items?.data?.[0]
  const start = item?.current_period_start
  const end = item?.current_period_end
  return {
    startIso: start ? new Date(start * 1000).toISOString() : null,
    endIso: end ? new Date(end * 1000).toISOString() : null,
  }
}

export function extractPrimaryPriceId(sub: Stripe.Subscription): string {
  const price = sub.items?.data?.[0]?.price
  if (!price) return ""
  return typeof price === "string" ? price : price.id
}

export function extractCustomerId(sub: Stripe.Subscription): string {
  return typeof sub.customer === "string" ? sub.customer : sub.customer.id
}

/**
 * UPSERT idempotente da Subscription na tabela local. Usado pelo webhook
 * e pelo reconcile do /minha-conta (race: redirect chega antes do webhook).
 * Retorna `false` quando a sub não tem `metadata.user_id` — não dá pra
 * vincular ao nosso DB sem isso.
 */
export async function syncSubscriptionToDb(
  admin: ReturnType<typeof createServerClient>,
  sub: Stripe.Subscription,
): Promise<boolean> {
  const userId = sub.metadata?.user_id
  if (!userId) {
    console.error("[syncSubscriptionToDb] sub sem metadata.user_id", sub.id)
    return false
  }

  const { startIso, endIso } = extractCurrentPeriod(sub)
  const canceledAt = sub.canceled_at
    ? new Date(sub.canceled_at * 1000).toISOString()
    : null

  const { error } = await admin
    .from("subscriptions")
    .upsert(
      {
        user_id: userId,
        stripe_subscription_id: sub.id,
        stripe_customer_id: extractCustomerId(sub),
        stripe_price_id: extractPrimaryPriceId(sub),
        status: sub.status as SubscriptionStatus,
        price_brl_cents: PREMIUM_MONTHLY.priceBrlCents,
        interval: "month",
        current_period_start: startIso,
        current_period_end: endIso,
        cancel_at_period_end: sub.cancel_at_period_end ?? false,
        canceled_at: canceledAt,
      },
      { onConflict: "stripe_subscription_id" },
    )

  if (error) {
    console.error("[syncSubscriptionToDb] upsert failed", sub.id, error.message)
    return false
  }
  return true
}

import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database, Subscription } from "@/lib/supabase/types"

type AnyClient = SupabaseClient<Database>

/**
 * Status que liberam features premium agora. past_due conta porque a Stripe
 * ainda tenta cobrar de novo automaticamente — só perde acesso ao cair em
 * canceled/unpaid após smart retries.
 */
const PREMIUM_STATUSES = new Set([
  "active",
  "trialing",
  "past_due",
])

/**
 * Lê a assinatura "viva" (não-terminal) do usuário. Retorna null se nunca
 * assinou ou se já cancelou e o período acabou. Inclui rows com
 * cancel_at_period_end=true até o período expirar.
 */
export async function getLiveSubscription(
  supabase: AnyClient,
  userId: string,
): Promise<Subscription | null> {
  const { data, error } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", userId)
    .in("status", [
      "incomplete",
      "trialing",
      "active",
      "past_due",
      "unpaid",
      "paused",
    ])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    console.error("[subscriptions] getLiveSubscription error:", error.message)
    return null
  }
  return data
}

/**
 * True se o usuário pode usar features premium agora (download, imprimir,
 * salvar). Aceita past_due — Stripe ainda está tentando cobrar.
 */
export function isPremium(subscription: Subscription | null): boolean {
  if (!subscription) return false
  if (!PREMIUM_STATUSES.has(subscription.status)) return false
  if (subscription.current_period_end) {
    return new Date(subscription.current_period_end).getTime() > Date.now()
  }
  return true
}

/**
 * Helper combinado: lê a assinatura e retorna { subscription, isPremium }.
 * Single trip ao DB.
 */
export async function getSubscriptionState(
  supabase: AnyClient,
  userId: string,
): Promise<{ subscription: Subscription | null; isPremium: boolean }> {
  const subscription = await getLiveSubscription(supabase, userId)
  return { subscription, isPremium: isPremium(subscription) }
}

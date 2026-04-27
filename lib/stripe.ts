import Stripe from "stripe"

let cached: Stripe | null = null

/**
 * Server-side Stripe singleton. Não importe em código de browser — a chave
 * secreta vaza. Use sempre dentro de Route Handlers, Server Actions ou em
 * arquivos `lib/server-only.ts`.
 */
export function getStripe(): Stripe {
  if (cached) return cached
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) {
    throw new Error("Missing STRIPE_SECRET_KEY in environment")
  }
  cached = new Stripe(key, {
    // Pinar a versão evita que upgrades silenciosos do SDK quebrem a
    // integração. "Dahlia" (atual) inclui mudanças desde "Basil" — onde foi
    // adicionado tax_id no billing_details, obrigatório pra Pix em contas US (Atlas).
    apiVersion: "2026-04-22.dahlia",
    appInfo: {
      name: "educando.app",
      url: "https://educando.app",
    },
  })
  return cached
}

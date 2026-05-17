/**
 * One-off: cancela uma Subscription na Stripe pelo ID e ressincroniza o DB.
 *
 * Uso:
 *   npm run cancel:premium -- sub_xxx
 *
 * Difere do endpoint /api/assinatura/cancelar (que apenas agenda
 * cancel_at_period_end=true) — esse cancela IMEDIATAMENTE. Usar só em
 * situações de cleanup (duplicatas, teste, debug).
 */
import { existsSync, readFileSync } from "node:fs"
import { resolve } from "node:path"
import { createClient } from "@supabase/supabase-js"
import Stripe from "stripe"

import { syncSubscriptionToDb } from "../lib/stripe-subscription-utils"
import type { Database } from "../lib/supabase/types"

function loadDotEnv(path: string) {
  if (!existsSync(path)) return
  const content = readFileSync(path, "utf8")
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line || line.startsWith("#")) continue
    const eq = line.indexOf("=")
    if (eq < 0) continue
    const key = line.slice(0, eq).trim()
    let value = line.slice(eq + 1).trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    if (key && process.env[key] === undefined) process.env[key] = value
  }
}

loadDotEnv(resolve(process.cwd(), ".env"))
loadDotEnv(resolve(process.cwd(), ".env.local"))

async function main() {
  const subId = process.argv[2]
  if (!subId || !subId.startsWith("sub_")) {
    console.error("Uso: npm run cancel:premium -- sub_xxx")
    process.exit(1)
  }

  const stripeKey = process.env.STRIPE_SECRET_KEY
  const supaUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supaKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!stripeKey || !supaUrl || !supaKey) {
    throw new Error(
      "Faltam STRIPE_SECRET_KEY / NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY no .env",
    )
  }

  const stripe = new Stripe(stripeKey, { apiVersion: "2026-04-22.dahlia" })
  const admin = createClient<Database>(supaUrl, supaKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  console.log(`→ cancelando ${subId} imediatamente na Stripe...`)
  const canceled = await stripe.subscriptions.cancel(subId)
  console.log(`  status agora: ${canceled.status}`)

  console.log(`→ sincronizando no DB...`)
  const ok = await syncSubscriptionToDb(admin, canceled)
  console.log(`  ${ok ? "✓ sincronizado" : "✗ falhou (ver logs acima)"}`)
}

main().catch((err) => {
  console.error("[cancel-subscription] erro:", err)
  process.exit(1)
})

/**
 * One-off: reconcilia a tabela `subscriptions` com a Stripe pra um usuário.
 * Útil quando o webhook não chegou / falhou e a Subscription real existe na
 * Stripe mas não no nosso DB.
 *
 * Uso (do root do projeto):
 *
 *   npm run reconcile:premium -- <user_id_uuid_ou_email>
 *
 * Lê STRIPE_SECRET_KEY + SUPABASE_SERVICE_ROLE_KEY + NEXT_PUBLIC_SUPABASE_URL
 * do .env (loader inline abaixo).
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
  const arg = process.argv[2]
  if (!arg) {
    console.error("Uso: npm run reconcile:premium -- <user_id|email>")
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

  // ─── 1. Resolve user_id e stripe_customer_id ─────────────────────────────
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(arg)
  let userQuery = admin.from("profiles").select("id, email, stripe_customer_id")
  userQuery = isUuid ? userQuery.eq("id", arg) : userQuery.eq("email", arg)
  const { data: profile, error: profileErr } = await userQuery.maybeSingle()

  if (profileErr || !profile) {
    throw new Error(`Profile não encontrado pra "${arg}": ${profileErr?.message ?? "vazio"}`)
  }
  if (!profile.stripe_customer_id) {
    console.log(`✗ user ${profile.email} nunca criou Stripe customer — nada pra reconciliar.`)
    return
  }
  console.log(`→ user ${profile.email} (${profile.id})`)
  console.log(`  customer ${profile.stripe_customer_id}`)

  // ─── 2. Lista TODAS as subs do customer na Stripe ───────────────────────
  const subs = await stripe.subscriptions.list({
    customer: profile.stripe_customer_id,
    status: "all",
    limit: 100,
    expand: ["data.items"],
  })

  if (subs.data.length === 0) {
    console.log("  nenhuma subscription na Stripe pra esse customer.")
    return
  }

  // ─── 3. Garante metadata.user_id em cada uma (necessário pro sync) ──────
  let synced = 0
  for (const sub of subs.data) {
    let candidate = sub
    if (!candidate.metadata?.user_id) {
      console.log(`  patching metadata.user_id em ${candidate.id}`)
      candidate = await stripe.subscriptions.update(candidate.id, {
        metadata: { ...(candidate.metadata ?? {}), user_id: profile.id, plan: "premium-monthly" },
      })
    }

    const ok = await syncSubscriptionToDb(admin, candidate)
    console.log(
      `  ${ok ? "✓" : "✗"} ${candidate.id}  status=${candidate.status}  cancel_at_period_end=${candidate.cancel_at_period_end}`,
    )
    if (ok) synced++
  }

  console.log("")
  console.log(`Pronto. ${synced}/${subs.data.length} sub(s) sincronizada(s).`)
}

main().catch((err) => {
  console.error("[reconcile-subscriptions] erro:", err)
  process.exit(1)
})

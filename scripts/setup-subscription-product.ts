/**
 * One-off: cria o Product e Price recorrente da assinatura premium na Stripe.
 *
 * Uso:
 *   npx tsx scripts/setup-subscription-product.ts
 *
 * Lê STRIPE_SECRET_KEY do .env automaticamente (loader inline abaixo).
 * Salva o priceId no stdout — cole no .env como STRIPE_PREMIUM_MONTHLY_PRICE_ID
 * (e no Vercel quando for pra produção).
 *
 * Idempotência: usa search para reaproveitar Product/Price existentes pelo
 * metadata.app === "educando" + plan === "premium-monthly".
 */
import { existsSync, readFileSync } from "node:fs"
import { resolve } from "node:path"
import Stripe from "stripe"

import { PREMIUM_MONTHLY } from "../lib/subscription-config"

// Loader minimalista de .env — tsx/node não carrega automaticamente. Não
// sobrescreve vars já definidas no ambiente (ex.: STRIPE_SECRET_KEY=...; npx ...).
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
    if (key && process.env[key] === undefined) {
      process.env[key] = value
    }
  }
}

loadDotEnv(resolve(process.cwd(), ".env"))
loadDotEnv(resolve(process.cwd(), ".env.local"))

const APP_KEY = "educando"
const PLAN_KEY = "premium-monthly"

async function main() {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) {
    throw new Error("Missing STRIPE_SECRET_KEY")
  }
  const stripe = new Stripe(key, { apiVersion: "2026-04-22.dahlia" })

  console.log("→ procurando Product existente...")
  const existingProducts = await stripe.products.search({
    query: `metadata['app']:'${APP_KEY}' AND metadata['plan']:'${PLAN_KEY}'`,
    limit: 1,
  })

  let product = existingProducts.data[0]
  if (product) {
    console.log(`  ✓ reusing product ${product.id}`)
  } else {
    product = await stripe.products.create({
      name: PREMIUM_MONTHLY.productName,
      description: "Assinatura mensal — downloads ilimitados, impressão e salvos",
      metadata: { app: APP_KEY, plan: PLAN_KEY },
    })
    console.log(`  ✓ created product ${product.id}`)
  }

  console.log("→ procurando Price existente...")
  const existingPrices = await stripe.prices.search({
    query: `product:'${product.id}' AND metadata['plan']:'${PLAN_KEY}' AND active:'true'`,
    limit: 5,
  })

  const matchingPrice = existingPrices.data.find(
    (p) =>
      p.currency === "brl" &&
      p.unit_amount === PREMIUM_MONTHLY.priceBrlCents &&
      p.recurring?.interval === PREMIUM_MONTHLY.interval,
  )

  let price = matchingPrice
  if (price) {
    console.log(`  ✓ reusing price ${price.id}`)
  } else {
    price = await stripe.prices.create({
      product: product.id,
      unit_amount: PREMIUM_MONTHLY.priceBrlCents,
      currency: "brl",
      recurring: { interval: PREMIUM_MONTHLY.interval },
      metadata: { app: APP_KEY, plan: PLAN_KEY },
      nickname: "Premium mensal R$ 24,90",
    })
    console.log(`  ✓ created price ${price.id}`)
  }

  console.log("")
  console.log("─────────────────────────────────────────────")
  console.log(`Cole no .env (e no Vercel):`)
  console.log("")
  console.log(`STRIPE_PREMIUM_MONTHLY_PRICE_ID=${price.id}`)
  console.log("─────────────────────────────────────────────")
}

main().catch((err) => {
  console.error("[setup-subscription-product] erro:", err)
  process.exit(1)
})

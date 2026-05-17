// Configuração da assinatura premium. Centralizada aqui pra evitar números
// mágicos espalhados pelo código. O priceId vem do Stripe Dashboard (ou do
// scripts/setup-subscription-product.ts) e é injetado por env.

export const PREMIUM_MONTHLY = {
  priceBrlCents: 2490,
  priceLabel: "R$ 24,90",
  interval: "month" as const,
  intervalLabel: "mês",
  productName: "educando.app Premium",
  /** Stripe Price ID (price_xxx). Criado uma vez no Dashboard. */
  envPriceIdKey: "STRIPE_PREMIUM_MONTHLY_PRICE_ID" as const,
} as const

export function getPremiumMonthlyPriceId(): string {
  const id = process.env[PREMIUM_MONTHLY.envPriceIdKey]
  if (!id) {
    throw new Error(
      `Missing ${PREMIUM_MONTHLY.envPriceIdKey} env var — rode scripts/setup-subscription-product.ts`,
    )
  }
  return id
}

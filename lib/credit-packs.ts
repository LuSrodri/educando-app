import type { PaymentPackCode } from "@/lib/supabase/types"

export interface CreditPack {
  code: PaymentPackCode
  label: string
  /** Atividades/materiais inclusos (1 crédito = 1 geração). */
  credits: number
  /** Preço em centavos de BRL (R$ 14,90 → 1490). */
  amountBrlCents: number
  /** Preço formatado em PT-BR pra exibição. */
  priceLabel: string
  /** Custo unitário pós-divisão, formatado em PT-BR. */
  unitPriceLabel: string
  recommended?: boolean
  /** Frase curta de pitch pra cards na landing/checkout. */
  pitch: string
}

export const CREDIT_PACKS: Record<PaymentPackCode, CreditPack> = {
  experimentar: {
    code: "experimentar",
    label: "Experimentar",
    credits: 5,
    amountBrlCents: 1490,
    priceLabel: "R$ 14,90",
    unitPriceLabel: "R$ 2,98 por atividade",
    pitch: "Pra testar antes de adotar.",
  },
  popular: {
    code: "popular",
    label: "Popular",
    credits: 15,
    amountBrlCents: 3990,
    priceLabel: "R$ 39,90",
    unitPriceLabel: "R$ 2,66 por atividade",
    recommended: true,
    pitch: "Cobre uma quinzena de aulas.",
  },
  melhor_valor: {
    code: "melhor_valor",
    label: "Melhor valor",
    credits: 40,
    amountBrlCents: 9990,
    priceLabel: "R$ 99,90",
    unitPriceLabel: "R$ 2,50 por atividade",
    pitch: "Pro bimestre inteiro, mais barato por unidade.",
  },
}

export const PACK_ORDER: PaymentPackCode[] = ["experimentar", "popular", "melhor_valor"]

export function getPack(code: string): CreditPack | null {
  if (code in CREDIT_PACKS) {
    return CREDIT_PACKS[code as PaymentPackCode]
  }
  return null
}

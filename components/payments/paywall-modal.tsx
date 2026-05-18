"use client"

import { BadgePlus, Bookmark, Crown, Download, Printer, Sparkles } from "lucide-react"
import { track } from "@vercel/analytics"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useAuthGate } from "@/components/auth/auth-gate-context"
import { PREMIUM_MONTHLY } from "@/lib/subscription-config"

const PLAN_ID = "premium_monthly"

const FOCUS_COPY = {
  download: {
    icon: Download,
    title: "Baixe esta atividade",
    description: "O download em alta resolução é exclusivo para assinantes Premium.",
  },
  print: {
    icon: Printer,
    title: "Imprima esta atividade",
    description: "A impressão direta é exclusiva para assinantes Premium.",
  },
  save: {
    icon: Bookmark,
    title: "Salve esta atividade",
    description: "Guardar atividades para ver depois é exclusivo para assinantes Premium.",
  },
} as const

export function PaywallModal() {
  const { user, isPaywallOpen, closePaywall, paywallOpts, activityTotal, openSubscription } =
    useAuthGate()

  function handleCtaClick() {
    track("paywall_cta_clicked", {
      user_id: user?.id ?? null,
      plan: PLAN_ID,
    })
    openSubscription()
  }

  const action = paywallOpts.action ?? "download"
  const Copy = FOCUS_COPY[action] ?? FOCUS_COPY.download
  const Icon = Copy.icon

  const totalLabel = activityTotal > 0 ? activityTotal.toLocaleString("pt-BR") : "centenas de"

  return (
    <Dialog open={isPaywallOpen} onOpenChange={(open) => !open && closePaywall()}>
      <DialogContent className="w-[480px] max-w-[92dvw] max-h-[90dvh] overflow-y-auto">
        <DialogHeader className="items-center text-center">
          <div className="mb-2 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-white shadow-lg">
            <Icon className="h-7 w-7" />
          </div>
          <DialogTitle className="text-xl">{Copy.title}</DialogTitle>
          <DialogDescription className="text-center">{Copy.description}</DialogDescription>
        </DialogHeader>

        <div className="rounded-2xl border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-white p-5">
          <div className="mb-3 flex items-center justify-center gap-2">
            <Crown className="h-5 w-5 text-amber-600" />
            <p className="font-heading text-base font-bold text-amber-900">
              Acesso Premium
            </p>
          </div>

          <ul className="space-y-2.5 text-sm text-gray-800">
            <li className="flex items-start gap-2">
              <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
              <span>
                Mais de <strong>{totalLabel}</strong> atividades pedagógicas alinhadas à BNCC
              </span>
            </li>
            <li className="flex items-start gap-2">
              <Download className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
              <span>
                <strong>Baixe e imprima</strong> sem nenhum limite, em alta resolução
              </span>
            </li>
            <li className="flex items-start gap-2">
              <Bookmark className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
              <span>
                <strong>Salve atividades</strong> para revisitar e organizar seu acervo
              </span>
            </li>
            <li className="flex items-start gap-2">
              <BadgePlus className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
              <span>
                <strong>Novas atividades</strong> todo domingo e quarta-feira
              </span>
            </li>
          </ul>

          <div className="mt-5 flex items-baseline justify-center gap-1">
            <span className="font-heading text-4xl font-black text-amber-900">
              {PREMIUM_MONTHLY.priceLabel}
            </span>
            <span className="text-sm text-amber-800">/{PREMIUM_MONTHLY.intervalLabel}</span>
          </div>
          <p className="text-center text-xs text-gray-500">
            Cancele quando quiser · sem fidelidade
          </p>
        </div>

        <Button
          size="lg"
          className="w-full bg-amber-600 text-white hover:bg-amber-700"
          onClick={handleCtaClick}
        >
          <Crown className="h-4 w-4" />
          Assinar agora
        </Button>

        <p className="text-center text-xs text-gray-500">
          Pagamento processado pela Stripe (cobrança internacional, pode incluir IOF do banco)
        </p>
      </DialogContent>
    </Dialog>
  )
}

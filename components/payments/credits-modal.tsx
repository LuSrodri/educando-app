"use client"

import { useEffect, useState } from "react"
import { Check } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useAuthGate } from "@/components/auth/auth-gate-context"
import { CheckoutForm, type QrData } from "@/components/pagamento/checkout-form"
import { PixQrDisplay } from "@/components/pagamento/pix-qr-display"
import { CREDIT_PACKS, PACK_ORDER } from "@/lib/credit-packs"
import type { PaymentPackCode } from "@/lib/supabase/types"

type Step = "pricing" | "form" | "pix" | "confirmed"

export function CreditsModal() {
  const { isCreditsOpen, closeCredits, creditsOpts, callAfterPaid, user } = useAuthGate()

  const [step, setStep] = useState<Step>("pricing")
  const [selectedPack, setSelectedPack] = useState<PaymentPackCode>("popular")
  const [paymentId, setPaymentId] = useState<string | null>(null)
  const [qrData, setQrData] = useState<QrData | null>(null)

  const defaultName = (user?.user_metadata?.full_name as string | undefined) ?? ""

  useEffect(() => {
    if (!isCreditsOpen) {
      const t = setTimeout(() => {
        setStep("pricing")
        setPaymentId(null)
        setQrData(null)
      }, 300)
      return () => clearTimeout(t)
    }

    if (creditsOpts.initialPack && creditsOpts.initialPack in CREDIT_PACKS) {
      setSelectedPack(creditsOpts.initialPack as PaymentPackCode)
    }
  }, [isCreditsOpen]) // eslint-disable-line react-hooks/exhaustive-deps

  function handlePaymentSuccess(id: string, qr: QrData) {
    setPaymentId(id)
    setQrData(qr)
    setStep("pix")
  }

  function handleGenerateNow() {
    callAfterPaid()
    closeCredits()
  }

  const pack = CREDIT_PACKS[selectedPack]

  return (
    <Dialog open={isCreditsOpen} onOpenChange={(open) => !open && closeCredits()}>
      <DialogContent className="w-[700px] max-w-[90dvw] max-h-[90dvh] overflow-x-hidden overflow-y-auto">
        {step === "pricing" && (
          <>
            <DialogHeader>
              <DialogTitle>Comprar créditos</DialogTitle>
              <DialogDescription>
                Pagamento único via Pix. Sem assinatura, sem renovação automática.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3">
              {PACK_ORDER.map((code) => {
                const p = CREDIT_PACKS[code]
                const isSelected = selectedPack === code
                return (
                  <button
                    key={code}
                    type="button"
                    onClick={() => setSelectedPack(code)}
                    className={`relative w-full rounded-xl border-2 p-4 text-left transition-all ${
                      isSelected
                        ? "border-amber-500 bg-amber-50 ring-2 ring-amber-200"
                        : "border-gray-200 bg-white hover:border-amber-200"
                    }`}
                  >
                    {p.recommended && (
                      <span className="absolute -top-3 left-3 rounded-full bg-amber-500 px-3 py-0.5 text-xs font-bold text-white">
                        Recomendado
                      </span>
                    )}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-gray-900">{p.label}</p>
                        <p className="text-xs text-gray-500">
                          {p.credits} créditos · {p.unitPriceLabel}
                        </p>
                        <p className="mt-1 text-xs text-gray-500">{p.pitch}</p>
                      </div>
                      <p className="shrink-0 font-heading text-xl font-black text-gray-900">
                        {p.priceLabel}
                      </p>
                    </div>
                  </button>
                )
              })}
            </div>

            <Button
              size="lg"
              className="w-full bg-amber-600 text-white hover:bg-amber-700"
              onClick={() => setStep("form")}
            >
              Continuar com {pack.label}
            </Button>

            <p className="text-center text-xs text-gray-500">
              IOF de 3,5% já embutido nos preços · processado via Ebanx/Stripe
            </p>
          </>
        )}

        {step === "form" && (
          <>
            <DialogHeader>
              <DialogTitle>Dados do pagamento</DialogTitle>
              <DialogDescription>
                {pack.label} · {pack.priceLabel} · {pack.credits} créditos
              </DialogDescription>
            </DialogHeader>
            <CheckoutForm
              packCode={selectedPack}
              packLabel={pack.label}
              priceLabel={pack.priceLabel}
              defaultName={defaultName}
              onSuccess={handlePaymentSuccess}
              onBack={() => setStep("pricing")}
            />
          </>
        )}

        {step === "pix" && paymentId && qrData && (
          <>
            <DialogHeader>
              <DialogTitle>Pague via Pix</DialogTitle>
              <DialogDescription>
                Escaneie o QR code ou copie o código Pix.
              </DialogDescription>
            </DialogHeader>
            <PixQrDisplay
              paymentId={paymentId}
              qrSvgDataUrl={qrData.qrImageUrl}
              pixCopyPaste={qrData.qrText}
              expiresAt={qrData.expiresAt}
              onPaid={() => setStep("confirmed")}
              onRetry={() => {
                setPaymentId(null)
                setQrData(null)
                setStep("pricing")
              }}
            />
          </>
        )}

        {step === "confirmed" && (
          <div className="flex flex-col items-center gap-4 py-6 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500 text-white">
              <Check className="h-8 w-8" />
            </div>
            <div>
              <p className="font-heading text-xl font-bold text-gray-900">
                Pagamento confirmado!
              </p>
              <p className="mt-1 text-sm text-gray-600">
                Seus créditos foram adicionados à conta.
              </p>
            </div>
            <Button
              size="lg"
              className="mt-2 bg-amber-600 text-white hover:bg-amber-700"
              onClick={handleGenerateNow}
            >
              Gerar agora
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

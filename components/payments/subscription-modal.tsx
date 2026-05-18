"use client"

import { useCallback, useEffect, useState } from "react"
import { loadStripe, type Stripe as StripeJs } from "@stripe/stripe-js"
import {
  EmbeddedCheckout,
  EmbeddedCheckoutProvider,
} from "@stripe/react-stripe-js"
import { track } from "@vercel/analytics"
import { Crown } from "lucide-react"
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

// stripePromise é singleton — Stripe.js carrega uma vez por sessão.
const PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
let stripePromiseCache: Promise<StripeJs | null> | null = null
function getStripePromise() {
  if (!stripePromiseCache) {
    if (!PUBLISHABLE_KEY) {
      console.error("Missing NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY")
      return Promise.resolve(null)
    }
    stripePromiseCache = loadStripe(PUBLISHABLE_KEY)
  }
  return stripePromiseCache
}

/**
 * Modal de checkout da assinatura premium via Stripe Embedded Checkout.
 *
 * A Stripe renderiza todo o UI (cartão, 3DS, erros, retries) dentro de um
 * iframe que o componente <EmbeddedCheckout /> monta. Quando o pagamento
 * confirma, a Stripe redireciona pro return_url definido no servidor
 * (`/minha-conta?assinatura=ativada&session_id=...`).
 *
 * O webhook `customer.subscription.created` é quem sincroniza a tabela
 * `subscriptions` — não precisamos detectar sucesso no client.
 */
export function SubscriptionModal() {
  const { user, isSubscriptionOpen, closeSubscription } = useAuthGate()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  // Incrementa quando o modal reabre — força remount do Provider pra criar
  // uma nova Checkout Session em vez de reusar uma que pode ter expirado.
  const [sessionKey, setSessionKey] = useState(0)

  useEffect(() => {
    if (isSubscriptionOpen) {
      setErrorMessage(null)
      setSessionKey((k) => k + 1)
    }
  }, [isSubscriptionOpen])

  const fetchClientSecret = useCallback(async (): Promise<string> => {
    track("checkout_started", {
      user_id: user?.id ?? null,
      plan: PLAN_ID,
    })
    const res = await fetch("/api/assinatura/criar", { method: "POST" })
    const data = (await res.json()) as { clientSecret?: string; error?: string }
    if (!res.ok || !data.clientSecret) {
      const msg =
        data.error === "already_subscribed"
          ? "Você já tem uma assinatura ativa."
          : "Não foi possível abrir o pagamento agora. Tente novamente em alguns segundos."
      setErrorMessage(msg)
      throw new Error(msg)
    }
    return data.clientSecret
  }, [user?.id])

  return (
    <Dialog open={isSubscriptionOpen} onOpenChange={(open) => !open && closeSubscription()}>
      <DialogContent className="w-[560px] max-w-[92dvw] max-h-[92dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-amber-600" />
            Assinar Premium
          </DialogTitle>
          <DialogDescription>
            {PREMIUM_MONTHLY.priceLabel}/mês · cancele quando quiser
          </DialogDescription>
        </DialogHeader>

        {errorMessage ? (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <p className="text-sm text-red-700">{errorMessage}</p>
            <Button variant="outline" onClick={closeSubscription}>
              Fechar
            </Button>
          </div>
        ) : isSubscriptionOpen ? (
          <div className="-mx-2 min-h-[400px]">
            <EmbeddedCheckoutProvider
              key={sessionKey}
              stripe={getStripePromise()}
              options={{ fetchClientSecret }}
            >
              <EmbeddedCheckout />
            </EmbeddedCheckoutProvider>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}

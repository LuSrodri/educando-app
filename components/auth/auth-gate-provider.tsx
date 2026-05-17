"use client"

import { useState, useRef, type ReactNode } from "react"
import type { User } from "@supabase/supabase-js"
import {
  AuthGateContext,
  type OpenLoginOpts,
  type OpenCreditsOpts,
  type OpenPaywallOpts,
} from "./auth-gate-context"
import { LoginModal } from "./login-modal"
import { CreditsModal } from "@/components/payments/credits-modal"
import { PaywallModal } from "@/components/payments/paywall-modal"
import { SubscriptionModal } from "@/components/payments/subscription-modal"

interface Props {
  initialUser: User | null
  initialIsPremium: boolean
  initialActivityTotal: number
  children: ReactNode
}

export function AuthGateProvider({
  initialUser,
  initialIsPremium,
  initialActivityTotal,
  children,
}: Props) {
  const [user] = useState<User | null>(initialUser)
  const [isPremium, setIsPremium] = useState(initialIsPremium)
  const [activityTotal] = useState(initialActivityTotal)

  const [isLoginOpen, setIsLoginOpen] = useState(false)
  const [isCreditsOpen, setIsCreditsOpen] = useState(false)
  const [isPaywallOpen, setIsPaywallOpen] = useState(false)
  const [isSubscriptionOpen, setIsSubscriptionOpen] = useState(false)

  const [loginOpts, setLoginOpts] = useState<OpenLoginOpts>({})
  const [creditsOpts, setCreditsOpts] = useState<OpenCreditsOpts>({})
  const [paywallOpts, setPaywallOpts] = useState<OpenPaywallOpts>({})

  const onAfterPaidRef = useRef<(() => void) | undefined>(undefined)
  const onAfterSubscribedRef = useRef<(() => void) | undefined>(undefined)

  function openLogin(opts?: OpenLoginOpts) {
    setLoginOpts(opts ?? {})
    setIsLoginOpen(true)
  }
  function closeLogin() {
    setIsLoginOpen(false)
  }

  function openCredits(opts?: OpenCreditsOpts) {
    onAfterPaidRef.current = opts?.onAfterPaid
    setCreditsOpts({ initialPack: opts?.initialPack })
    setIsCreditsOpen(true)
  }
  function closeCredits() {
    setIsCreditsOpen(false)
  }

  function openPaywall(opts?: OpenPaywallOpts) {
    onAfterSubscribedRef.current = opts?.onAfterSubscribed
    setPaywallOpts({ action: opts?.action })
    // Paywall sempre vem antes do login — o pitch é o que convence o user a
    // criar conta. Quando ele clicar em "Assinar agora", aí sim checamos
    // auth (em openSubscription).
    setIsPaywallOpen(true)
  }
  function closePaywall() {
    setIsPaywallOpen(false)
  }

  function openSubscription() {
    setIsPaywallOpen(false)

    // Sem login: abre o modal de login. Depois do login bem-sucedido, o
    // redirect leva o user de volta pra mesma página — ele clica de novo
    // no botão premium e dessa vez já cai direto no checkout.
    if (!user) {
      setLoginOpts({ next: typeof window !== "undefined" ? window.location.pathname : "/" })
      setIsLoginOpen(true)
      return
    }
    setIsSubscriptionOpen(true)
  }
  function closeSubscription() {
    setIsSubscriptionOpen(false)
  }

  function callAfterPaid() {
    onAfterPaidRef.current?.()
    onAfterPaidRef.current = undefined
  }
  function callAfterSubscribed() {
    onAfterSubscribedRef.current?.()
    onAfterSubscribedRef.current = undefined
  }

  function markAsPremium() {
    setIsPremium(true)
  }

  return (
    <AuthGateContext.Provider
      value={{
        user,
        isPremium,
        activityTotal,
        isLoginOpen,
        isCreditsOpen,
        isPaywallOpen,
        isSubscriptionOpen,
        loginOpts,
        creditsOpts,
        paywallOpts,
        callAfterPaid,
        callAfterSubscribed,
        openLogin,
        closeLogin,
        openCredits,
        closeCredits,
        openPaywall,
        closePaywall,
        openSubscription,
        closeSubscription,
        markAsPremium,
      }}
    >
      {children}
      <LoginModal />
      <CreditsModal />
      <PaywallModal />
      <SubscriptionModal />
    </AuthGateContext.Provider>
  )
}

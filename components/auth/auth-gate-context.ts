"use client"

import { createContext, useContext } from "react"
import type { User } from "@supabase/supabase-js"

export interface OpenLoginOpts {
  next?: string
}

export interface OpenCreditsOpts {
  onAfterPaid?: () => void
  initialPack?: string
}

export type PaywallAction = "download" | "print" | "save" | "becomePremium"

export interface OpenPaywallOpts {
  action?: PaywallAction
  /**
   * Callback chamado quando a assinatura é ativada com sucesso. Útil pra
   * disparar a ação original (download/print/save) imediatamente após o
   * paywall converter.
   */
  onAfterSubscribed?: () => void
}

export interface AuthGateContextValue {
  user: User | null
  isPremium: boolean
  /** Total de atividades curated no diretório — usado nos argumentos do paywall. */
  activityTotal: number

  isLoginOpen: boolean
  isCreditsOpen: boolean
  isPaywallOpen: boolean
  isSubscriptionOpen: boolean

  loginOpts: OpenLoginOpts
  creditsOpts: OpenCreditsOpts
  paywallOpts: OpenPaywallOpts

  callAfterPaid: () => void
  callAfterSubscribed: () => void

  openLogin: (opts?: OpenLoginOpts) => void
  closeLogin: () => void

  openCredits: (opts?: OpenCreditsOpts) => void
  closeCredits: () => void

  /** Abre o modal de paywall premium. Se o usuário não está logado, abre login antes. */
  openPaywall: (opts?: OpenPaywallOpts) => void
  closePaywall: () => void

  /** Abre o modal de checkout da assinatura (depois do paywall ou direto pelo /minha-conta). */
  openSubscription: () => void
  closeSubscription: () => void

  /** Marca usuário como premium após confirmação no Stripe. Provider re-renderiza. */
  markAsPremium: () => void
}

export const AuthGateContext = createContext<AuthGateContextValue | null>(null)

export function useAuthGate(): AuthGateContextValue {
  const ctx = useContext(AuthGateContext)
  if (!ctx) throw new Error("useAuthGate must be used within AuthGateProvider")
  return ctx
}

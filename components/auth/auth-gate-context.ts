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

export interface AuthGateContextValue {
  user: User | null
  isLoginOpen: boolean
  isCreditsOpen: boolean
  loginOpts: OpenLoginOpts
  creditsOpts: OpenCreditsOpts
  callAfterPaid: () => void
  openLogin: (opts?: OpenLoginOpts) => void
  closeLogin: () => void
  openCredits: (opts?: OpenCreditsOpts) => void
  closeCredits: () => void
}

export const AuthGateContext = createContext<AuthGateContextValue | null>(null)

export function useAuthGate(): AuthGateContextValue {
  const ctx = useContext(AuthGateContext)
  if (!ctx) throw new Error("useAuthGate must be used within AuthGateProvider")
  return ctx
}

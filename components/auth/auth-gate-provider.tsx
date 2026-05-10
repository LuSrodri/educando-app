"use client"

import { useState, useRef, type ReactNode } from "react"
import type { User } from "@supabase/supabase-js"
import {
  AuthGateContext,
  type OpenLoginOpts,
  type OpenCreditsOpts,
} from "./auth-gate-context"
import { LoginModal } from "./login-modal"
import { CreditsModal } from "@/components/payments/credits-modal"

interface Props {
  initialUser: User | null
  children: ReactNode
}

export function AuthGateProvider({ initialUser, children }: Props) {
  const [user] = useState<User | null>(initialUser)
  const [isLoginOpen, setIsLoginOpen] = useState(false)
  const [isCreditsOpen, setIsCreditsOpen] = useState(false)
  const [loginOpts, setLoginOpts] = useState<OpenLoginOpts>({})
  const [creditsOpts, setCreditsOpts] = useState<OpenCreditsOpts>({})
  const onAfterPaidRef = useRef<(() => void) | undefined>(undefined)

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

  function callAfterPaid() {
    onAfterPaidRef.current?.()
    onAfterPaidRef.current = undefined
  }

  return (
    <AuthGateContext.Provider
      value={{
        user,
        isLoginOpen,
        isCreditsOpen,
        loginOpts,
        creditsOpts,
        callAfterPaid,
        openLogin,
        closeLogin,
        openCredits,
        closeCredits,
      }}
    >
      {children}
      <LoginModal />
      <CreditsModal />
    </AuthGateContext.Provider>
  )
}

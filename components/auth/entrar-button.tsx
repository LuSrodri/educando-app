"use client"

import { useAuthGate } from "./auth-gate-context"

export function EntrarButton({ className }: { className?: string }) {
  const { openLogin } = useAuthGate()
  return (
    <button
      type="button"
      onClick={() => openLogin()}
      className={
        className ??
        "text-sm font-medium text-gray-700 transition-colors hover:text-amber-700 cursor-pointer"
      }
    >
      Entrar
    </button>
  )
}

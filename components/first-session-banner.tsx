"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { X, Sparkles } from "lucide-react"

const SESSION_KEY = "edu_banner_dismissed"

export function FirstSessionBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (sessionStorage.getItem(SESSION_KEY)) return
    const timer = setTimeout(() => setVisible(true), 1500)
    return () => clearTimeout(timer)
  }, [])

  function dismiss() {
    sessionStorage.setItem(SESSION_KEY, "1")
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div
      role="complementary"
      aria-label="Convite para criar atividades"
      className="fixed bottom-5 right-5 z-50 w-80 animate-in fade-in slide-in-from-bottom-4 rounded-2xl border border-amber-200 bg-white p-5 shadow-xl duration-300"
    >
      <button
        onClick={dismiss}
        aria-label="Fechar"
        className="absolute right-3 top-3 rounded-full p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
        <Sparkles className="h-5 w-5" />
      </div>

      <p className="pr-6 text-sm font-semibold leading-snug text-gray-900">
        Crie a sua própria atividade em menos de 1 minuto!
      </p>
      <p className="mt-1 text-xs text-gray-500">
        Personalizada pro seu tema, alinhada à BNCC.
      </p>

      <div className="mt-4 flex items-center gap-2">
        <Link
          href="/sejamembro"
          onClick={dismiss}
          className="flex-1 rounded-xl bg-amber-500 px-4 py-2 text-center text-sm font-semibold text-white transition-colors hover:bg-amber-600"
        >
          Saiba Mais
        </Link>
        <button
          onClick={dismiss}
          className="rounded-xl border border-gray-200 px-4 py-2 text-sm text-gray-600 transition-colors hover:bg-gray-50"
        >
          Agora não
        </button>
      </div>
    </div>
  )
}

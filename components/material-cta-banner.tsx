"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { Sparkles, X } from "lucide-react"

const STORAGE_KEY = "educando:material-cta-dismissed"
const DELAY_MS = 15_000

export function MaterialCtaBanner() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (typeof window === "undefined") return
    if (sessionStorage.getItem(STORAGE_KEY) === "1") return

    const timeout = setTimeout(() => setOpen(true), DELAY_MS)
    return () => clearTimeout(timeout)
  }, [])

  function dismiss() {
    setOpen(false)
    if (typeof window !== "undefined") {
      sessionStorage.setItem(STORAGE_KEY, "1")
    }
  }

  if (!open) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="material-cta-title"
      className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6"
    >
      <div
        aria-hidden
        className="absolute inset-0 bg-gray-950/60 backdrop-blur-sm"
        onClick={dismiss}
      />

      <div className="relative w-full max-w-md rounded-2xl border-2 border-amber-300 bg-white p-7 shadow-2xl">
        <button
          type="button"
          onClick={dismiss}
          aria-label="Fechar"
          className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500 text-white shadow-lg">
          <Sparkles className="h-6 w-6" />
        </div>

        <h2
          id="material-cta-title"
          className="font-heading text-xl font-bold leading-snug text-gray-900"
        >
          Não é ainda a atividade que você busca?
        </h2>

        <p className="mt-2 text-sm leading-relaxed text-gray-600">
          Crie o seu próprio material personalizado em menos de 1 minuto — alinhado à BNCC e ao seu contexto de aula.
        </p>

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end">
          <button
            type="button"
            onClick={dismiss}
            className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900"
          >
            Agora não
          </button>
          <Link
            href="/sejamembro"
            onClick={dismiss}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-amber-500 px-5 py-2.5 text-sm font-bold text-white shadow-md transition-all hover:bg-amber-600 hover:shadow-lg"
          >
            <Sparkles className="h-4 w-4" />
            Criar minha atividade
          </Link>
        </div>
      </div>
    </div>
  )
}

"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { Sparkles, X } from "lucide-react"

const STORAGE_KEY = "educando:material-cta-dismissed"
const DELAY_MS = 16_000

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
      role="complementary"
      aria-label="Convite para criar atividade personalizada"
      className="pointer-events-none fixed inset-x-0 bottom-4 z-40 flex justify-center px-4 sm:bottom-6"
    >
      <div className="pointer-events-auto relative flex w-full max-w-md items-center gap-3 rounded-2xl border border-amber-200 bg-white/95 p-4 pr-10 shadow-2xl backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4 duration-300 sm:gap-4 sm:p-5 sm:pr-12">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white shadow-md sm:h-11 sm:w-11">
          <Sparkles className="h-5 w-5" />
        </div>

        <div className="min-w-0 flex-1">
          <p className="font-heading text-sm font-bold leading-snug text-gray-900 sm:text-base">
            Quer essa atividade adaptada para sua turma?
          </p>
          <p className="mt-0.5 text-xs leading-snug text-gray-600">
            Crie sua versão personalizada em menos de 1 minuto.
          </p>
          <Link
            href="/sejamembro"
            onClick={dismiss}
            className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-bold text-white shadow-sm transition-all hover:bg-amber-600 sm:text-sm"
          >
            Personalizar para minha turma
          </Link>
        </div>

        <button
          type="button"
          onClick={dismiss}
          aria-label="Fechar"
          className="absolute right-2 top-2 inline-flex h-7 w-7 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

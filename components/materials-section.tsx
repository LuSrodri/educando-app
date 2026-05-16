"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { ChevronLeft, ChevronRight, GraduationCap } from "lucide-react"
import type { Activity } from "@/lib/supabase/types"
import { DirectorySearch } from "@/components/directory-search"
import { DirectoryGrid } from "@/components/directory-grid"

const PAGE_SIZE = 24

interface MaterialsSectionProps {
  initialActivities: Activity[]
  initialTotal: number
  initialQuery?: string
  syncUrl?: boolean
}

function getPaginationPages(current: number, total: number): (number | "...")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const pages: (number | "...")[] = [1]
  if (current > 3) pages.push("...")
  const start = Math.max(2, current - 1)
  const end = Math.min(total - 1, current + 1)
  for (let i = start; i <= end; i++) pages.push(i)
  if (current < total - 2) pages.push("...")
  pages.push(total)
  return pages
}

export function MaterialsSection({
  initialActivities,
  initialTotal,
  initialQuery,
  syncUrl = false,
}: MaterialsSectionProps) {
  const seededQuery = initialQuery?.trim() ?? ""
  const [inputValue, setInputValue] = useState(seededQuery)
  const [submittedQuery, setSubmittedQuery] = useState(seededQuery)
  const [activities, setActivities] = useState<Activity[]>(initialActivities)
  const [total, setTotal] = useState(initialTotal)
  const [page, setPage] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [errorReason, setErrorReason] = useState<string | null>(null)

  const sectionRef = useRef<HTMLElement | null>(null)
  const fetchSeqRef = useRef(0)

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  const runFetch = useCallback(
    async (nextQuery: string, nextPage: number) => {
      const seq = ++fetchSeqRef.current
      setIsLoading(true)
      setErrorReason(null)
      try {
        const params = new URLSearchParams({
          page: String(nextPage),
          limit: String(PAGE_SIZE),
        })
        if (nextQuery.trim()) params.set("q", nextQuery.trim())

        const res = await fetch(`/api/search?${params.toString()}`, {
          headers: { Accept: "application/json" },
        })

        if (res.status === 401) {
          const body = await res.json().catch(() => ({ reason: "unauthorized" }))
          if (seq !== fetchSeqRef.current) return
          const reason =
            typeof body.reason === "string"
              ? body.reason.replace(/^query_/, "")
              : "unauthorized"
          setErrorReason(reason)
          setActivities([])
          setTotal(0)
          return
        }
        if (res.status === 429) {
          setErrorReason("rate_limited")
          return
        }
        if (!res.ok) throw new Error("search_failed")
        const { data, total: t } = await res.json()
        if (seq !== fetchSeqRef.current) return
        setActivities(data ?? [])
        setTotal(t ?? 0)
      } catch {
        if (seq !== fetchSeqRef.current) return
        setErrorReason("unknown")
        setActivities([])
        setTotal(0)
      } finally {
        if (seq === fetchSeqRef.current) setIsLoading(false)
      }
    },
    [],
  )

  useEffect(() => {
    if (!syncUrl || typeof window === "undefined") return
    const onPopState = () => {
      const tema = new URL(window.location.href).searchParams.get("tema")?.trim() ?? ""
      setInputValue(tema)
      setSubmittedQuery(tema)
      setPage(1)
      setErrorReason(null)
    }
    window.addEventListener("popstate", onPopState)
    return () => window.removeEventListener("popstate", onPopState)
  }, [syncUrl])

  // Reset to the full directory snapshot whenever the user clears the query.
  useEffect(() => {
    if (!submittedQuery && page === 1) {
      setActivities(initialActivities)
      setTotal(initialTotal)
      setErrorReason(null)
      setIsLoading(false)
      return
    }
    runFetch(submittedQuery, page)
    // runFetch is stable-ish; include it to satisfy the linter.
  }, [submittedQuery, page, initialActivities, initialTotal, runFetch])

  const pushQueryToUrl = useCallback(
    (q: string) => {
      if (!syncUrl || typeof window === "undefined") return
      const url = new URL(window.location.href)
      if (q) url.searchParams.set("tema", q)
      else url.searchParams.delete("tema")
      window.history.pushState({}, "", url.toString())
    },
    [syncUrl],
  )

  const handleSubmit = useCallback(
    (value: string) => {
      const q = value.trim()
      setSubmittedQuery(q)
      setPage(1)
      pushQueryToUrl(q)
    },
    [pushQueryToUrl],
  )

  const handleClear = useCallback(() => {
    setInputValue("")
    setSubmittedQuery("")
    setPage(1)
    setErrorReason(null)
    pushQueryToUrl("")
  }, [pushQueryToUrl])

  const goTo = useCallback(
    (p: number) => {
      if (p < 1 || p > totalPages || p === page) return
      setPage(p)
      sectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
    },
    [page, totalPages],
  )

  const subheading = useMemo(() => {
    const count = total.toLocaleString("pt-BR")
    if (errorReason) {
      const messages: Record<string, string> = {
        irrelevant: "Essa busca parece fora do escopo pedagógico. Tente um tema escolar.",
        nonsense: "Não entendi essa busca. Tente palavras-chave escolares, tema ou código BNCC.",
        injection: "Essa busca não foi aceita.",
        illegal: "Essa busca não foi aceita.",
        sexual: "Essa busca não foi aceita.",
        abuse: "Essa busca não foi aceita.",
        too_long: "A busca é longa demais — use no máximo 160 caracteres.",
        rate_limited: "Muitas buscas em pouco tempo. Aguarde um minuto e tente novamente.",
        unauthorized: "Busca bloqueada. Tente outra formulação.",
        unknown: "Erro ao buscar. Tente novamente.",
      }
      return messages[errorReason] ?? messages.unknown
    }
    if (isLoading && submittedQuery) {
      return `Buscando atividades para "${submittedQuery}"…`
    }
    return submittedQuery
      ? `${count} ${total === 1 ? "resultado" : "resultados"} para "${submittedQuery}".`
      : `São ${count} atividades e materiais de apoio para te auxiliar no preparo da aula.`
  }, [total, submittedQuery, errorReason, isLoading])

  return (
    <section id="materiais" ref={sectionRef} className="container mx-auto px-4 py-14 sm:py-16">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="space-y-3 text-center">
          <h2 className="font-heading text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl md:text-4xl">
            Busque o material ideal para sua próxima aula
          </h2>
          <p className={`text-sm sm:text-base md:text-lg ${errorReason ? "text-red-600" : "text-gray-600"}`}>
            {subheading}
          </p>
        </div>

        <DirectorySearch
          value={inputValue}
          onChange={setInputValue}
          onSubmit={handleSubmit}
          onClear={handleClear}
          isLoading={isLoading}
          hasActiveQuery={Boolean(submittedQuery || inputValue)}
        />

        <DirectoryGrid
          activities={activities}
          isLoading={isLoading}
          coringaImagePath={page === totalPages ? initialActivities[0]?.image_path ?? null : null}
          coringaTema={page === totalPages ? submittedQuery || null : null}
        />

        {totalPages > 1 && !errorReason && (
          <div className="flex items-center justify-center gap-1 pt-2">
            <button
              onClick={() => goTo(page - 1)}
              disabled={page === 1 || isLoading}
              className="rounded-md p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-30"
              aria-label="Página anterior"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            {getPaginationPages(page, totalPages).map((p, i) =>
              p === "..." ? (
                <span
                  key={`ellipsis-${i}`}
                  className="select-none px-2 text-sm text-gray-400"
                  aria-hidden
                >
                  …
                </span>
              ) : (
                <button
                  key={p}
                  onClick={() => goTo(p)}
                  disabled={isLoading}
                  aria-current={p === page ? "page" : undefined}
                  className={`h-9 min-w-[36px] rounded-md text-sm font-medium transition-colors ${
                    p === page
                      ? "bg-amber-500 text-white"
                      : "text-gray-600 hover:bg-gray-100 disabled:opacity-50"
                  }`}
                >
                  {p}
                </button>
              ),
            )}

            <button
              onClick={() => goTo(page + 1)}
              disabled={page === totalPages || isLoading}
              className="rounded-md p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-30"
              aria-label="Próxima página"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}

      </div>
    </section>
  )
}

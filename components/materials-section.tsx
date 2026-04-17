"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { ChevronLeft, ChevronRight, GraduationCap } from "lucide-react"
import type { Activity } from "@/lib/supabase/types"
import { DirectorySearch } from "@/components/directory-search"
import { DirectoryGrid } from "@/components/directory-grid"
import { TurnstileWidget } from "@/components/turnstile-widget"
import { useFingerprint } from "@/hooks/useFingerprint"

const PAGE_SIZE = 24

interface MaterialsSectionProps {
  initialActivities: Activity[]
  initialTotal: number
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

export function MaterialsSection({ initialActivities, initialTotal }: MaterialsSectionProps) {
  const router = useRouter()
  const fpId = useFingerprint()
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null)
  const [query, setQuery] = useState("")
  const [activities, setActivities] = useState<Activity[]>(initialActivities)
  const [total, setTotal] = useState(initialTotal)
  const [page, setPage] = useState(1)
  const [isLoading, setIsLoading] = useState(false)

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const sectionRef = useRef<HTMLElement | null>(null)
  const fetchSeqRef = useRef(0)

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  const runFetch = useCallback(
    async (nextQuery: string, nextPage: number) => {
      const seq = ++fetchSeqRef.current
      setIsLoading(true)
      try {
        const params = new URLSearchParams({
          page: String(nextPage),
          limit: String(PAGE_SIZE),
        })
        if (nextQuery.trim()) params.set("q", nextQuery.trim())
        const headers: Record<string, string> = { Accept: "application/json" }
        if (fpId) headers["x-fp-id"] = fpId
        if (turnstileToken) headers["x-cf-turnstile-token"] = turnstileToken
        const res = await fetch(`/api/search?${params.toString()}`, { headers })
        if (res.status === 401) {
          router.push("/401")
          return
        }
        if (!res.ok) throw new Error("search_failed")
        const { data, total: t } = await res.json()
        if (seq !== fetchSeqRef.current) return
        setActivities(data ?? [])
        setTotal(t ?? 0)
      } catch {
        if (seq !== fetchSeqRef.current) return
        setActivities([])
        setTotal(0)
      } finally {
        if (seq === fetchSeqRef.current) setIsLoading(false)
      }
    },
    [fpId, turnstileToken, router],
  )

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!query.trim() && page === 1) {
      setActivities(initialActivities)
      setTotal(initialTotal)
      setIsLoading(false)
      return
    }
    debounceRef.current = setTimeout(() => runFetch(query, page), query ? 300 : 0)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query, page, initialActivities, initialTotal, runFetch])

  useEffect(() => {
    setPage(1)
  }, [query])

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
    return query.trim()
      ? `${count} ${total === 1 ? "resultado" : "resultados"} para "${query}".`
      : `São ${count} atividades e materiais de apoio para te auxiliar no plano de aula.`
  }, [total, query])

  return (
    <section id="materiais" ref={sectionRef} className="container mx-auto px-4 py-14 sm:py-16">
      <TurnstileWidget onToken={setTurnstileToken} onError={() => setTurnstileToken(null)} />

      <div className="mx-auto max-w-5xl space-y-6">
        <div className="space-y-3 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700 sm:text-sm">
            <GraduationCap className="h-4 w-4" aria-hidden />
            Materiais para Professores
          </div>
          <h2 className="font-heading text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl md:text-4xl">
            Busque o material ideal para sua próxima aula
          </h2>
          <p className="text-sm text-gray-600 sm:text-base md:text-lg">{subheading}</p>
        </div>

        <DirectorySearch value={query} onChange={setQuery} isLoading={isLoading} />

        <DirectoryGrid
          activities={activities}
          isLoading={isLoading && activities.length === 0}
          fpId={fpId}
        />

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-1 pt-2">
            <button
              onClick={() => goTo(page - 1)}
              disabled={page === 1 || isLoading}
              className="cursor-pointer rounded-md p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-30"
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
                  className={`h-9 min-w-[36px] cursor-pointer rounded-md text-sm font-medium transition-colors ${
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
              className="cursor-pointer rounded-md p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-30"
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

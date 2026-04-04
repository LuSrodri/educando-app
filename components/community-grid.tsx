"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Eye, Loader2, Users, ChevronLeft, ChevronRight } from "lucide-react"
import type { Activity } from "@/lib/supabase/types"
import { getActivityThumbnailUrl } from "@/lib/image-utils"
import { generateSemanticSlug } from "@/lib/slug"

const PAGE_SIZE = 12

function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str
  return str.slice(0, maxLength - 3) + "..."
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

export function CommunityGrid() {
  const [activities, setActivities] = useState<Activity[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(false)

  const totalPages = Math.ceil(total / PAGE_SIZE)

  useEffect(() => {
    setIsLoading(true)
    setError(false)

    fetch(`/api/community?page=${page}&limit=${PAGE_SIZE}`)
      .then((res) => {
        if (!res.ok) throw new Error()
        return res.json()
      })
      .then(({ data, total: t }) => {
        setActivities(data)
        setTotal(t)
      })
      .catch(() => setError(true))
      .finally(() => setIsLoading(false))
  }, [page])

  const goTo = (p: number) => {
    if (p < 1 || p > totalPages) return
    setPage(p)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  if (!isLoading && !error && activities.length === 0 && page === 1) {
    return (
      <div className="text-center py-12">
        <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500">Ainda não há atividades na comunidade.</p>
        <p className="text-gray-400 text-sm mt-1">Seja o primeiro a gerar uma atividade!</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Total count */}
      {total > 0 && (
        <p className="text-sm text-gray-500">
          <span className="font-semibold text-gray-700">{total.toLocaleString("pt-BR")}</span>{" "}
          atividades geradas pela comunidade
        </p>
      )}

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: PAGE_SIZE }).map((_, i) => (
            <div key={i} className="aspect-[3/4] bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-12 text-sm text-red-600">
          Erro ao carregar atividades.{" "}
          <button
            onClick={() => goTo(page)}
            className="text-amber-600 hover:text-amber-700 font-medium underline cursor-pointer"
          >
            Tentar novamente
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {activities.map((activity) => (
            <Link
              key={activity.id}
              href={`/atividade/${generateSemanticSlug(activity.original_prompt, activity.id)}`}
              prefetch={false}
            >
              <Card className="group overflow-hidden border border-gray-100 hover:border-amber-300 transition-colors h-full cursor-pointer">
                <CardContent className="p-0">
                  <div className="relative aspect-[3/4] overflow-hidden bg-gray-100">
                    <img
                      src={getActivityThumbnailUrl(activity.image_path, 440)}
                      alt={truncate(activity.original_prompt, 50)}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-300 flex items-center justify-center">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div className="bg-white rounded-full px-3 py-1.5 flex items-center gap-1.5 text-gray-800 text-xs font-medium shadow-lg">
                          <Eye className="w-3.5 h-3.5" />
                          Ver
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="p-3">
                    <p className="text-xs text-gray-600 line-clamp-2">{activity.original_prompt}</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-1 pt-2">
          <button
            onClick={() => goTo(page - 1)}
            disabled={page === 1 || isLoading}
            className="p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
            aria-label="Página anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {getPaginationPages(page, totalPages).map((p, i) =>
            p === "..." ? (
              <span key={`ellipsis-${i}`} className="px-2 text-gray-400 text-sm select-none">
                …
              </span>
            ) : (
              <button
                key={p}
                onClick={() => goTo(p)}
                disabled={isLoading}
                className={`min-w-[36px] h-9 rounded-md text-sm font-medium transition-colors cursor-pointer ${
                  p === page
                    ? "bg-amber-500 text-white"
                    : "text-gray-600 hover:bg-gray-100 disabled:opacity-50"
                }`}
              >
                {p}
              </button>
            )
          )}

          <button
            onClick={() => goTo(page + 1)}
            disabled={page === totalPages || isLoading}
            className="p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
            aria-label="Próxima página"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  )
}

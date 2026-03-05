"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Eye, Loader2, Users } from "lucide-react"
import type { Activity } from "@/lib/supabase/types"

interface CommunityGridProps {
  initialActivities: Activity[]
}

function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str
  return str.slice(0, maxLength - 3) + "..."
}

export function CommunityGrid({ initialActivities }: CommunityGridProps) {
  const [activities, setActivities] = useState<Activity[]>(initialActivities)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(initialActivities.length >= 50)
  const observerRef = useRef<HTMLDivElement>(null)

  const loadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore) return
    setIsLoadingMore(true)
    try {
      const response = await fetch(`/api/community?offset=${activities.length}&limit=50`)
      if (response.ok) {
        const newActivities = await response.json()
        if (newActivities.length < 50) {
          setHasMore(false)
        }
        setActivities((prev) => [...prev, ...newActivities])
      }
    } catch (error) {
      console.error("Error loading more activities:", error)
    } finally {
      setIsLoadingMore(false)
    }
  }, [activities.length, isLoadingMore, hasMore])

  // Infinite scroll with IntersectionObserver
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore) {
          loadMore()
        }
      },
      { threshold: 0.1 }
    )

    if (observerRef.current) {
      observer.observe(observerRef.current)
    }

    return () => observer.disconnect()
  }, [loadMore, hasMore, isLoadingMore])

  if (activities.length === 0) {
    return (
      <div className="text-center py-12">
        <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500">
          Ainda não há atividades na comunidade.
        </p>
        <p className="text-gray-400 text-sm mt-1">
          Seja o primeiro a gerar uma atividade!
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {activities.map((activity) => (
          <Link key={activity.id} href={`/atividade/${activity.id}`} prefetch={false}>
            <Card className="group overflow-hidden border border-gray-100 hover:border-amber-300 transition-colors h-full cursor-pointer">
              <CardContent className="p-0">
                <div className="relative aspect-[3/4] overflow-hidden bg-gray-100">
                  <img
                    src={`/api/share/${activity.id}/image`}
                    alt={truncate(activity.original_prompt, 50)}
                    className="w-full h-full object-cover object-top transition-transform duration-300 group-hover:scale-105"
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
                  <p className="text-xs text-gray-600 line-clamp-2">
                    {activity.original_prompt}
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Infinite scroll trigger */}
      <div ref={observerRef} className="flex justify-center py-4">
        {isLoadingMore && (
          <div className="flex items-center gap-2 text-gray-500 text-sm">
            <Loader2 className="w-4 h-4 animate-spin" />
            Carregando mais...
          </div>
        )}
      </div>
    </div>
  )
}

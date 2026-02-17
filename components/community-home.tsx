"use client"

import { useState, useEffect } from "react"
import { Users } from "lucide-react"
import { CommunityGrid } from "@/components/community-grid"
import type { Activity } from "@/lib/supabase/types"

export function CommunitySection() {
  const [activities, setActivities] = useState<Activity[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchActivities() {
      try {
        const response = await fetch("/api/community?limit=50&offset=0")
        if (response.ok) {
          const data = await response.json()
          setActivities(data)
        }
      } catch (error) {
        console.error("Error fetching community activities:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchActivities()
  }, [])

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-gray-900 font-heading flex items-center gap-2">
        <Users className="w-5 h-5 text-amber-600" />
        Comunidade
      </h2>
      <p className="text-sm text-gray-500">
        Todas as atividades geradas pelos educadores.
      </p>

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="aspect-[3/4] bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : (
        <CommunityGrid initialActivities={activities} />
      )}
    </div>
  )
}

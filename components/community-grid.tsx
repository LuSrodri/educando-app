"use client"

import { useState } from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { GraduationCap, Eye, Loader2 } from "lucide-react"
import { EDUCATIONAL_LEVELS, type EducationalLevelId } from "@/types/educational-levels"
import type { Activity } from "@/lib/supabase/types"

interface CommunityGridProps {
  initialActivities: Activity[]
}

function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str
  return str.slice(0, maxLength - 3) + "..."
}

function getLevelLabel(levelId: string): string {
  const level = EDUCATIONAL_LEVELS[levelId as EducationalLevelId]
  return level?.displayName || levelId
}

function getGradeLabel(levelId: string, grade: string | null): string {
  if (!grade) return ""
  if (levelId === "alfabetizacao") {
    return grade === "Pre-1" ? "Pré 1" : "Pré 2"
  }
  return `${grade}º ano`
}

function getLevelColor(levelId: string): string {
  switch (levelId) {
    case "alfabetizacao":
      return "bg-pink-100 text-pink-800 border-pink-200"
    case "fundamental_1":
      return "bg-blue-100 text-blue-800 border-blue-200"
    case "fundamental_2":
      return "bg-purple-100 text-purple-800 border-purple-200"
    default:
      return "bg-gray-100 text-gray-800 border-gray-200"
  }
}

export function CommunityGrid({ initialActivities }: CommunityGridProps) {
  const [activities, setActivities] = useState<Activity[]>(initialActivities)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(initialActivities.length >= 50)

  const loadMore = async () => {
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
  }

  if (activities.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">
          Ainda não há atividades compartilhadas na comunidade.
        </p>
        <p className="text-gray-400 mt-2">
          Seja o primeiro a compartilhar uma atividade!
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {activities.map((activity) => (
          <Link key={activity.id} href={`/atividade/${activity.id}`}>
            <Card className="group overflow-hidden border-2 border-gray-100 hover:border-amber-300 transition-all duration-300 hover:shadow-lg h-full">
              <CardContent className="p-0">
                {/* Image */}
                <div className="relative aspect-[3/4] overflow-hidden bg-gray-100">
                  <img
                    src={`/api/share/${activity.id}/image`}
                    alt={truncate(activity.original_prompt, 50)}
                    className="w-full h-full object-cover object-top transition-transform duration-300 group-hover:scale-105"
                    loading="lazy"
                  />
                  {/* Overlay on hover */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-300 flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="bg-white rounded-full px-4 py-2 flex items-center gap-2 text-gray-800 font-medium shadow-lg">
                        <Eye className="w-4 h-4" />
                        Ver Atividade
                      </div>
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4 space-y-3">
                  <Badge className={`${getLevelColor(activity.educational_level)} text-xs`}>
                    <GraduationCap className="w-3 h-3 mr-1" />
                    {getLevelLabel(activity.educational_level)}
                    {activity.grade && ` - ${getGradeLabel(activity.educational_level, activity.grade)}`}
                  </Badge>

                  <p className="text-sm text-gray-700 line-clamp-2 font-medium">
                    {activity.original_prompt}
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Load more */}
      {hasMore && (
        <div className="flex justify-center pt-4">
          <Button
            onClick={loadMore}
            disabled={isLoadingMore}
            variant="outline"
            size="lg"
            className="border-amber-400 text-amber-700 hover:bg-amber-50"
          >
            {isLoadingMore ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Carregando...
              </>
            ) : (
              "Carregar mais"
            )}
          </Button>
        </div>
      )}
    </div>
  )
}

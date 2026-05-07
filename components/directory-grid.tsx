"use client"

import Link from "next/link"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Eye } from "lucide-react"
import type { Activity } from "@/lib/supabase/types"
import { getActivityThumbnailUrl } from "@/lib/image-utils"
import { generateMaterialSlug } from "@/lib/slug"
import { CoringaCard } from "@/components/coringa-card"

interface DirectoryGridProps {
  activities: Activity[]
  isLoading: boolean
  coringaImagePath?: string | null
  coringaTema?: string | null
}

function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str
  return str.slice(0, maxLength - 3) + "..."
}

export function DirectoryGrid({ activities, isLoading, coringaImagePath, coringaTema }: DirectoryGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="aspect-[3/4] animate-pulse rounded-lg bg-gray-100" />
        ))}
      </div>
    )
  }

  const showCoringa = !!(coringaImagePath && coringaTema)

  if (activities.length === 0 && !showCoringa) {
    return null
  }

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
      {activities.map((activity) => {
        const title = activity.title ?? "Material pedagógico"
        const slug = generateMaterialSlug(activity.theme, activity.id)
        const href = `/material/${slug}`
        const logClick = () => {
          try {
            const payload = JSON.stringify({
              activityId: activity.id,
              referrer: window.location.href,
            })
            const blob = new Blob([payload], { type: "application/json" })
            if (navigator.sendBeacon) {
              navigator.sendBeacon("/api/telemetry/click", blob)
            } else {
              fetch("/api/telemetry/click", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: payload,
                keepalive: true,
              }).catch(() => {})
            }
          } catch {
            // never block navigation on telemetry
          }
        }
        return (
          <Link
            key={activity.id}
            href={href}
            prefetch={false}
            target="_blank"
            rel="noopener"
            onClick={logClick}
            onAuxClick={logClick}
            className="group focus:outline-none"
            data-activity-id={activity.id}
          >
            <Card className="h-full overflow-hidden border border-gray-100 transition-colors group-hover:border-amber-300 group-focus-visible:border-amber-500">
              <CardContent className="p-0">
                <div className="relative aspect-[3/4] overflow-hidden bg-gray-100">
                  <Image
                    src={getActivityThumbnailUrl(activity.image_path, 440)}
                    alt={truncate(title, 50)}
                    fill
                    sizes="(min-width: 1024px) 220px, (min-width: 768px) 30vw, 50vw"
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors duration-300 group-hover:bg-black/30">
                    <div className="opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                      <div className="flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-medium text-gray-800 shadow-lg">
                        <Eye className="h-3.5 w-3.5" />
                        Abrir
                      </div>
                    </div>
                  </div>
                  {activity.type === "support_material" && (
                    <Badge className="absolute left-2 top-2 bg-amber-500/90 hover:bg-amber-500 text-white">
                      Material de apoio
                    </Badge>
                  )}
                </div>
                <div className="space-y-1 p-3">
                  <p className="line-clamp-2 text-sm font-semibold text-gray-900">{title}</p>
                  {activity.theme && (
                    <p className="line-clamp-1 text-xs text-gray-500">{activity.theme}</p>
                  )}
                  {activity.bncc_codes.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {activity.bncc_codes.slice(0, 2).map((code) => (
                        <span
                          key={code}
                          className="rounded bg-amber-50 px-1.5 py-0.5 font-mono text-[10px] text-amber-700"
                        >
                          {code}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </Link>
        )
      })}
      {coringaImagePath && coringaTema && (
        <CoringaCard imagePath={coringaImagePath} tema={coringaTema} />
      )}
    </div>
  )
}

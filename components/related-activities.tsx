"use client"

import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Eye, Sparkles } from "lucide-react"
import type { Activity } from "@/lib/supabase/types"
import { getActivityThumbnailUrl } from "@/lib/image-utils"
import { generateMaterialSlug } from "@/lib/slug"

interface RelatedActivitiesProps {
  activities: Activity[]
}

function truncate(str: string, max: number): string {
  if (str.length <= max) return str
  return str.slice(0, max - 1).trimEnd() + "…"
}

function logClick(activityId: string) {
  try {
    const payload = JSON.stringify({
      activityId,
      referrer: typeof window !== "undefined" ? window.location.href : "",
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

export function RelatedActivities({ activities }: RelatedActivitiesProps) {
  if (activities.length === 0) return null

  return (
    <section className="border-t border-amber-100 bg-gradient-to-b from-amber-50/40 to-white">
      <div className="container mx-auto px-4 py-12 md:py-16">
        <div className="mx-auto max-w-6xl">
          <div className="mb-6 flex items-end justify-between gap-4 sm:mb-8">
            <div>
              <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-white px-2.5 py-1 text-[11px] font-medium uppercase tracking-wide text-amber-700">
                <Sparkles className="h-3 w-3" />
                Recomendados
              </div>
              <h2 className="font-heading text-xl font-bold text-gray-900 sm:text-2xl md:text-3xl">
                Veja também
              </h2>
              <p className="mt-1.5 max-w-xl text-sm text-gray-600 sm:text-base">
                Materiais com tema parecido ou códigos da BNCC em comum.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 md:gap-5">
            {activities.map((activity) => {
              const title = activity.title ?? "Material pedagógico"
              const slug = generateMaterialSlug(activity.theme, activity.id)
              const href = `/material/${slug}`
              const onClick = () => logClick(activity.id)
              return (
                <Link
                  key={activity.id}
                  href={href}
                  prefetch={false}
                  target="_blank"
                  rel="noopener"
                  onClick={onClick}
                  onAuxClick={onClick}
                  className="group focus:outline-none"
                  data-activity-id={activity.id}
                >
                  <Card className="h-full overflow-hidden border border-gray-100 bg-white transition-all duration-300 group-hover:-translate-y-0.5 group-hover:border-amber-300 group-hover:shadow-md group-focus-visible:border-amber-500">
                    <CardContent className="p-0">
                      <div className="relative aspect-[3/4] overflow-hidden bg-gray-100">
                        <img
                          src={getActivityThumbnailUrl(activity.image_path, 440)}
                          alt={truncate(title, 50)}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors duration-300 group-hover:bg-black/30">
                          <div className="translate-y-1 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                            <div className="flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-medium text-gray-800 shadow-lg">
                              <Eye className="h-3.5 w-3.5" />
                              Abrir
                            </div>
                          </div>
                        </div>
                        {activity.type === "support_material" && (
                          <span className="absolute left-2 top-2 rounded-full bg-amber-500/90 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white shadow-sm">
                            Apoio
                          </span>
                        )}
                      </div>
                      <div className="space-y-1.5 p-3 sm:p-4">
                        <p className="line-clamp-2 text-sm font-semibold leading-snug text-gray-900 sm:text-[15px]">
                          {title}
                        </p>
                        {activity.theme && (
                          <p className="line-clamp-1 text-xs text-gray-500 sm:text-[13px]">
                            {activity.theme}
                          </p>
                        )}
                        {activity.bncc_codes.length > 0 && (
                          <div className="flex flex-wrap gap-1 pt-1">
                            {activity.bncc_codes.slice(0, 3).map((code) => (
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
          </div>
        </div>
      </div>
    </section>
  )
}

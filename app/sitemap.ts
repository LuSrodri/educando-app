import { MetadataRoute } from "next"
import { createServerClient } from "@/lib/supabase/server"
import { generateMaterialSlug } from "@/lib/slug"

export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://educando.app"

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/sejamembro`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/privacidade`,
      lastModified: new Date("2026-04-27"),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${baseUrl}/termos`,
      lastModified: new Date("2026-04-27"),
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ]

  let activityPages: MetadataRoute.Sitemap = []
  try {
    const supabase = createServerClient()
    const { data: activities } = await supabase
      .from("activities")
      .select("id, theme, bncc_codes, updated_at")
      .not("title", "is", null)
      .order("updated_at", { ascending: false })

    if (activities) {
      activityPages = activities.map((activity) => ({
        url: `${baseUrl}/material/${generateMaterialSlug(activity.theme, activity.id)}`,
        lastModified: new Date(activity.updated_at),
        changeFrequency: "monthly" as const,
        priority: activity.bncc_codes.length > 0 ? 0.7 : 0.5,
      }))
    }
  } catch (error) {
    console.error("Error fetching activities for sitemap:", error)
  }

  return [...staticPages, ...activityPages]
}

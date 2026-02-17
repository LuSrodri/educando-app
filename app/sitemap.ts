import { MetadataRoute } from "next"
import { createServerClient } from "@/lib/supabase/server"

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
  ]

  // All activities
  let activityPages: MetadataRoute.Sitemap = []
  try {
    const supabase = createServerClient()
    const { data: activities } = await supabase
      .from("activities")
      .select("id, created_at")
      .order("created_at", { ascending: false })

    if (activities) {
      activityPages = activities.map((activity) => ({
        url: `${baseUrl}/atividade/${activity.id}`,
        lastModified: new Date(activity.created_at),
        changeFrequency: "yearly" as const,
        priority: 0.5,
      }))
    }
  } catch (error) {
    console.error("Error fetching activities for sitemap:", error)
  }

  return [...staticPages, ...activityPages]
}

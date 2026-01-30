import { MetadataRoute } from "next"
import { blogPosts } from "@/lib/blog-posts"
import { getSharedActivities } from "@/lib/activities"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://educando.app"

  // Paginas estaticas principais
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/comunidade`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/historico`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
  ]

  // Páginas dinâmicas do blog
  const blogPages: MetadataRoute.Sitemap = blogPosts.map((post) => ({
    url: `${baseUrl}/blog/${post.slug}`,
    lastModified: new Date(post.publishedAt),
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }))

  // Atividades compartilhadas (limitado a 500 para performance)
  let activityPages: MetadataRoute.Sitemap = []
  try {
    const sharedActivities = await getSharedActivities(500)
    activityPages = sharedActivities.map((activity) => ({
      url: `${baseUrl}/atividade/${activity.id}`,
      lastModified: new Date(activity.shared_at || activity.created_at),
      changeFrequency: "yearly" as const,
      priority: 0.5,
    }))
  } catch (error) {
    console.error("Error fetching shared activities for sitemap:", error)
  }

  return [...staticPages, ...blogPages, ...activityPages]
}

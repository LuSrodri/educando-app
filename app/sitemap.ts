import { MetadataRoute } from "next"
import { blogPosts } from "@/lib/blog-posts"

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://educando.app"

  // Páginas estáticas principais
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
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

  return [...staticPages, ...blogPages]
}

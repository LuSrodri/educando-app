import { notFound } from "next/navigation"
import { cookies } from "next/headers"
import type { Metadata } from "next"
import { getActivity, getActivityBySlug, getRelatedActivities } from "@/lib/activities"
import { getActivityImageUrl } from "@/lib/image-utils"
import { isUUID, generateMaterialSlug } from "@/lib/slug"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, Tag } from "lucide-react"
import { SharedActivityClient } from "./shared-activity-client"
import { RelatedActivities } from "@/components/related-activities"
import { SiteHeader } from "@/components/site-header"
import { RedirectSearchBar } from "@/components/redirect-search-bar"
import { MaterialPaywallModal } from "@/components/material/material-paywall-modal"
import { getCurrentUser } from "@/lib/supabase/ssr-server"
import type { Activity } from "@/lib/supabase/types"
import { SITE_URL } from "@/lib/site-config"

interface PageProps {
  params: Promise<{ slug: string }>
}

async function resolveActivity(
  slug: string,
): Promise<{ activity: Activity | null; id: string | null }> {
  if (isUUID(slug)) {
    const activity = await getActivity(slug)
    return { activity, id: slug }
  }
  const activity = await getActivityBySlug(slug)
  return { activity, id: activity?.id ?? null }
}

// Atividades geradas por usuário (user_id IS NOT NULL) só existem em /personalizado/[slug].
function isCuratedDirectoryItem(activity: Activity): boolean {
  return activity.user_id == null
}

function formatDate(dateString: string | null) {
  if (!dateString) return ""
  return new Date(dateString).toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const { activity, id } = await resolveActivity(slug)

  if (!activity || !id || !isCuratedDirectoryItem(activity)) {
    return {
      title: "Material não encontrado | educando.app",
      description: "O material solicitado não foi encontrado.",
    }
  }

  const title = activity.title ?? "Material pedagógico"
  const description =
    activity.short_description ??
    "Material pedagógico do diretório educando.app, alinhado à BNCC."
  const canonicalSlug = generateMaterialSlug(activity.theme, id)
  const pageUrl = `${SITE_URL}/material/${canonicalSlug}`

  return {
    title,
    description,
    keywords: ["atividade escolar", "material de apoio", "BNCC", "professor", activity.theme ?? ""],
    robots: { index: true, follow: true },
    openGraph: {
      title,
      description,
      type: "article",
      url: pageUrl,
      siteName: "educando.app",
      locale: "pt_BR",
    },
    twitter: { card: "summary_large_image", title, description, images: [{ url: `${SITE_URL}/material/${slug}/opengraph-image`, alt: title }] },
    alternates: { canonical: pageUrl },
  }
}

export default async function MaterialPage({ params }: PageProps) {
  const { slug } = await params
  const { activity, id } = await resolveActivity(slug)

  if (!activity || !id || !isCuratedDirectoryItem(activity)) notFound()

  const title = activity.title ?? "Material pedagógico"
  const imageUrl = getActivityImageUrl(activity.image_path)
  const pageUrl = `${SITE_URL}/material/${generateMaterialSlug(activity.theme, id)}`
  const related = await getRelatedActivities(activity, 3)

  const [user, cookieStore] = await Promise.all([getCurrentUser(), cookies()])
  const refusedPaywall = cookieStore.get("paywall_refused")?.value === "1"
  const showPaywall = !user && !refusedPaywall
  const paywallTheme = activity.theme ?? title

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    description: activity.long_description ?? activity.short_description ?? "",
    image: imageUrl,
    datePublished: activity.created_at ?? activity.updated_at,
    url: pageUrl,
    author: { "@type": "Organization", name: "educando.app" },
    publisher: { "@type": "Organization", name: "educando.app", url: SITE_URL },
    isPartOf: { "@type": "WebSite", name: "educando.app", url: SITE_URL },
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <SiteHeader />
      <main className="min-h-screen bg-gradient-to-b from-amber-50 to-white">
        <div className="border-b border-amber-100 bg-amber-50">
          <div className="container mx-auto px-4 py-3">
            <RedirectSearchBar />
          </div>
        </div>

        <div className="container mx-auto px-4 py-8 md:py-12">
          <div className="mx-auto max-w-4xl">
            <div className="mb-6">
              <div className="mb-4 flex flex-wrap items-center gap-2">
                {activity.theme && (
                  <Badge variant="outline" className="border-amber-300 text-amber-700">
                    <Tag className="mr-1 h-3 w-3" />
                    {activity.theme}
                  </Badge>
                )}
                {activity.bncc_codes.map((code) => (
                  <Badge key={code} variant="secondary" className="font-mono text-xs">
                    {code}
                  </Badge>
                ))}
                {activity.created_at && (
                  <Badge variant="outline" className="text-gray-500">
                    <Calendar className="mr-1 h-3 w-3" />
                    {formatDate(activity.created_at)}
                  </Badge>
                )}
              </div>

              <h1 className="mb-2 font-heading text-xl font-bold text-gray-900 md:text-2xl">
                {title}
              </h1>

              {activity.long_description && (
                <p className="mt-3 leading-relaxed text-gray-700">{activity.long_description}</p>
              )}
            </div>

            <Card className="overflow-hidden border-2 border-amber-200 shadow-lg">
              <CardContent className="p-0">
                <div className="bg-white p-4 md:p-6">
                  <img
                    src={imageUrl}
                    alt={title}
                    className="h-auto w-full rounded-lg shadow-md"
                  />
                </div>
                <SharedActivityClient activityId={id} imageUrl={imageUrl} activityTitle={title} />
              </CardContent>
            </Card>
          </div>
        </div>

        <RelatedActivities activities={related} currentActivity={activity} />
      </main>
      {showPaywall && <MaterialPaywallModal theme={paywallTheme} />}
    </>
  )
}

import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import type { Metadata } from "next"
import { getActivity, getActivityBySlug } from "@/lib/activities"
import { getActivityImageUrl } from "@/lib/image-utils"
import { isUUID } from "@/lib/slug"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Calendar, Lock, Tag } from "lucide-react"
import { SharedActivityClient } from "@/app/material/[slug]/shared-activity-client"
import { SiteHeader } from "@/components/site-header"
import { getCurrentUser } from "@/lib/supabase/ssr-server"
import type { Activity } from "@/lib/supabase/types"

export const dynamic = "force-dynamic"

interface PageProps {
  params: Promise<{ slug: string }>
}

export const metadata: Metadata = {
  title: "Atividade personalizada | educando.app",
  description: "Sua atividade pedagógica personalizada.",
  robots: { index: false, follow: false },
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

function formatDate(dateString: string | null) {
  if (!dateString) return ""
  return new Date(dateString).toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

export default async function PersonalizadoPage({ params }: PageProps) {
  const { slug } = await params

  const user = await getCurrentUser()
  if (!user) redirect("/sejamembro")

  const { activity, id } = await resolveActivity(slug)
  if (!activity || !id) notFound()
  if (activity.user_id !== user.id) notFound()

  const title = activity.title ?? "Atividade pedagógica"
  const imageUrl = getActivityImageUrl(activity.image_path)

  return (
    <>
      <SiteHeader />
      <main className="min-h-screen bg-gradient-to-b from-amber-50 to-white">
        <div className="border-b border-amber-100 bg-amber-50">
          <div className="container mx-auto flex flex-wrap items-center justify-between gap-3 px-4 py-3">
            <Link
              href="/minha-conta"
              className="flex w-fit items-center gap-1 text-sm text-amber-700 hover:text-amber-800"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar à minha conta
            </Link>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-white px-3 py-1 text-xs font-medium text-amber-800">
              <Lock className="h-3 w-3" />
              Material privado — só você vê
            </span>
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
      </main>
    </>
  )
}

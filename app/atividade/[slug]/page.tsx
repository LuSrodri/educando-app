import Link from "next/link"
import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { getActivity, getActivityBySlug } from "@/lib/activities"
import { getActivityImageUrl } from "@/lib/image-utils"
import { isUUID, generateSemanticSlug } from "@/lib/slug"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  BookOpen,
  Sparkles,
  ArrowLeft,
  Calendar,
  ExternalLink
} from "lucide-react"
import { SharedActivityClient } from "./shared-activity-client"
import type { Activity } from "@/lib/supabase/types"

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://educando.app"

interface PageProps {
  params: Promise<{ slug: string }>
}

async function resolveActivity(slug: string): Promise<{ activity: Activity | null; id: string | null }> {
  if (isUUID(slug)) {
    const activity = await getActivity(slug)
    return { activity, id: slug }
  }

  const activity = await getActivityBySlug(slug)
  return { activity, id: activity?.id ?? null }
}

function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str
  return str.slice(0, maxLength - 3) + "..."
}

function formatDate(dateString: string) {
  const date = new Date(dateString)
  return date.toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "long",
    year: "numeric"
  })
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const { activity, id } = await resolveActivity(slug)

  if (!activity || !id) {
    return {
      title: "Atividade não encontrada | educando.app",
      description: "A atividade solicitada não foi encontrada.",
    }
  }

  const semanticSlug = generateSemanticSlug(activity.original_prompt, id)
  const promptPreview = truncate(activity.original_prompt, 60)
  const title = `Atividade: ${promptPreview}`
  const description = `Atividade pedagógica criada com educando.app - Gerador de atividades escolares alinhadas à BNCC. Descrição: ${activity.original_prompt}`
  const imageUrl = getActivityImageUrl(activity.image_path)
  const pageUrl = isUUID(slug)
    ? `${BASE_URL}/atividade/${id}`
    : `${BASE_URL}/atividade/${semanticSlug}`

  return {
    title,
    description,
    keywords: [
      "atividade escolar",
      "educação",
      "BNCC",
      "material didático",
      "professor",
      "ensino fundamental",
    ],
    authors: [{ name: "educando.app" }],
    creator: "educando.app",
    publisher: "educando.app",
    robots: { index: true, follow: true },
    openGraph: {
      title,
      description,
      type: "article",
      url: pageUrl,
      siteName: "educando.app",
      locale: "pt_BR",
      images: [
        {
          url: imageUrl,
          width: 2480,
          height: 3508,
          alt: title,
          type: "image/png",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl],
    },
    alternates: { canonical: pageUrl },
  }
}

export default async function SharedActivityPage({ params }: PageProps) {
  const { slug } = await params
  const { activity, id } = await resolveActivity(slug)

  if (!activity || !id) {
    notFound()
  }

  const imageUrl = getActivityImageUrl(activity.image_path)
  const pageUrl = isUUID(slug)
    ? `${BASE_URL}/atividade/${id}`
    : `${BASE_URL}/atividade/${generateSemanticSlug(activity.original_prompt, id)}`

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: truncate(activity.original_prompt, 110),
    description: `Atividade pedagógica gerada com IA pelo educando.app. ${activity.original_prompt}`,
    image: imageUrl,
    datePublished: activity.created_at,
    url: pageUrl,
    author: {
      "@type": "Organization",
      name: "educando.app",
    },
    publisher: {
      "@type": "Organization",
      name: "educando.app",
      url: BASE_URL,
    },
    isPartOf: {
      "@type": "WebSite",
      name: "educando.app",
      url: BASE_URL,
    },
  }

  return (
    <>
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
    <main className="min-h-screen bg-gradient-to-b from-amber-50 to-white">
      <header className="border-b border-amber-200 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl text-gray-900 font-heading">educando<span className="text-amber-600">.app</span></span>
          </Link>
          <Link href="/#gerador">
            <Button className="bg-amber-600 hover:bg-amber-700 text-white">
              <Sparkles className="w-4 h-4 mr-2" />
              Criar Atividade
            </Button>
          </Link>
        </div>
      </header>

      <div className="bg-amber-50 border-b border-amber-100">
        <div className="container mx-auto px-4 py-3">
          <Link href="/" className="text-amber-700 hover:text-amber-800 text-sm flex items-center gap-1 w-fit">
            <ArrowLeft className="w-4 h-4" />
            Voltar ao início
          </Link>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <Badge variant="outline" className="text-gray-500">
                <Calendar className="w-3 h-3 mr-1" />
                {formatDate(activity.created_at)}
              </Badge>
            </div>

            <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-2 font-heading">
              {activity.original_prompt}
            </h1>
          </div>

          <Card className="overflow-hidden border-2 border-amber-200 shadow-lg">
            <CardContent className="p-0">
              <div className="bg-white p-4 md:p-6">
                <img
                  src={imageUrl}
                  alt={`Atividade: ${activity.original_prompt}`}
                  className="w-full h-auto rounded-lg shadow-md"
                />
              </div>

              <SharedActivityClient
                activityId={id}
                imageUrl={imageUrl}
                activityTitle={activity.original_prompt}
              />
            </CardContent>
          </Card>

          <Card className="mt-8 border-2 border-amber-400 bg-gradient-to-br from-amber-50 to-amber-100">
            <CardContent className="p-6 md:p-8 text-center">
              <div className="w-12 h-12 bg-amber-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-2 font-heading">
                Crie sua própria atividade!
              </h2>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                Com o educando.app, você cria atividades pedagógicas personalizadas em apenas 30 segundos.
                Sem login, sem complicação.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link href="/#gerador">
                  <Button size="lg" className="bg-amber-600 hover:bg-amber-700 text-white font-bold w-full sm:w-auto">
                    <Sparkles className="w-5 h-5 mr-2" />
                    Gerar Atividade Grátis
                  </Button>
                </Link>
                <Link href="/">
                  <Button size="lg" variant="outline" className="border-amber-400 text-amber-700 hover:bg-amber-50 w-full sm:w-auto">
                    <ExternalLink className="w-5 h-5 mr-2" />
                    Conhecer o educando.app
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
    </>
  )
}

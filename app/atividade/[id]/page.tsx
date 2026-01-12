import Link from "next/link"
import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { getActivity } from "@/lib/activities"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  BookOpen,
  Sparkles,
  Download,
  Printer,
  ArrowLeft,
  GraduationCap,
  Calendar,
  Share2,
  ExternalLink
} from "lucide-react"
import { EDUCATIONAL_LEVELS, type EducationalLevelId } from "@/types/educational-levels"
import { SharedActivityClient } from "./shared-activity-client"

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://educando.app"

interface PageProps {
  params: Promise<{ id: string }>
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

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const activity = await getActivity(id)

  if (!activity || !activity.shared_at) {
    return {
      title: "Atividade não encontrada | educando.app",
      description: "A atividade solicitada não foi encontrada ou não está disponível para compartilhamento.",
    }
  }

  const promptPreview = truncate(activity.original_prompt, 60)
  const title = `Atividade: ${promptPreview}`
  const levelLabel = getLevelLabel(activity.educational_level)
  const gradeLabel = getGradeLabel(activity.educational_level, activity.grade)
  const description = `Atividade pedagógica para ${levelLabel}${gradeLabel ? ` - ${gradeLabel}` : ""}. Criada com educando.app - Gerador de atividades escolares alinhadas à BNCC.`
  const imageUrl = `${BASE_URL}/api/share/${id}/image`
  const pageUrl = `${BASE_URL}/atividade/${id}`

  return {
    title,
    description,
    keywords: [
      "atividade escolar",
      "educação",
      "BNCC",
      levelLabel,
      gradeLabel,
      "material didático",
      "professor",
      "ensino fundamental",
    ].filter(Boolean),
    authors: [{ name: "educando.app" }],
    creator: "educando.app",
    publisher: "educando.app",
    robots: {
      index: true,
      follow: true,
    },
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
          width: 595,
          height: 842,
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
      creator: "@educandoapp",
    },
    alternates: {
      canonical: pageUrl,
    },
  }
}

export default async function SharedActivityPage({ params }: PageProps) {
  const { id } = await params
  const activity = await getActivity(id)

  // If activity doesn't exist or isn't shared, return 404
  if (!activity || !activity.shared_at) {
    notFound()
  }

  const levelLabel = getLevelLabel(activity.educational_level)
  const gradeLabel = getGradeLabel(activity.educational_level, activity.grade)
  const imageUrl = `/api/share/${id}/image`

  return (
    <main className="min-h-screen bg-gradient-to-b from-amber-50 to-white">
      {/* Header */}
      <header className="border-b border-amber-200 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl text-gray-900">educando<span className="text-amber-600">.app</span></span>
          </Link>
          <Link href="/#gerador">
            <Button className="bg-amber-600 hover:bg-amber-700 text-white">
              <Sparkles className="w-4 h-4 mr-2" />
              Criar Atividade
            </Button>
          </Link>
        </div>
      </header>

      {/* Breadcrumb */}
      <div className="bg-amber-50 border-b border-amber-100">
        <div className="container mx-auto px-4 py-3">
          <Link href="/" className="text-amber-700 hover:text-amber-800 text-sm flex items-center gap-1 w-fit">
            <ArrowLeft className="w-4 h-4" />
            Voltar ao início
          </Link>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="max-w-4xl mx-auto">
          {/* Activity Info */}
          <div className="mb-6">
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <Badge className="bg-green-100 text-green-800 border-green-200">
                <Share2 className="w-3 h-3 mr-1" />
                Atividade Compartilhada
              </Badge>
              <Badge variant="outline" className="text-gray-600">
                <GraduationCap className="w-3 h-3 mr-1" />
                {levelLabel}{gradeLabel ? ` - ${gradeLabel}` : ""}
              </Badge>
              <Badge variant="outline" className="text-gray-500">
                <Calendar className="w-3 h-3 mr-1" />
                {formatDate(activity.created_at)}
              </Badge>
            </div>

            <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">
              {activity.original_prompt}
            </h1>

            {activity.improved_prompt && activity.improved_prompt !== activity.original_prompt && (
              <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3 border border-gray-100">
                <span className="font-medium text-gray-700">Prompt aprimorado:</span>{" "}
                {truncate(activity.improved_prompt, 200)}
              </p>
            )}
          </div>

          {/* Activity Image Card */}
          <Card className="overflow-hidden border-2 border-amber-200 shadow-lg">
            <CardContent className="p-0">
              <div className="bg-white p-4 md:p-6">
                <img
                  src={imageUrl}
                  alt={`Atividade: ${activity.original_prompt}`}
                  className="w-full h-auto rounded-lg shadow-md"
                />
              </div>

              {/* Actions */}
              <SharedActivityClient
                activityId={id}
                imageUrl={imageUrl}
                activityTitle={activity.original_prompt}
              />
            </CardContent>
          </Card>

          {/* CTA */}
          <Card className="mt-8 border-2 border-amber-400 bg-gradient-to-br from-amber-50 to-amber-100">
            <CardContent className="p-6 md:p-8 text-center">
              <div className="w-12 h-12 bg-amber-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">
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

          {/* Features Mini */}
          <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="p-4 bg-white rounded-lg border border-gray-100">
              <div className="text-2xl mb-1">⚡</div>
              <p className="text-sm font-medium text-gray-700">30 segundos</p>
              <p className="text-xs text-gray-500">para criar</p>
            </div>
            <div className="p-4 bg-white rounded-lg border border-gray-100">
              <div className="text-2xl mb-1">📚</div>
              <p className="text-sm font-medium text-gray-700">Alinhado à BNCC</p>
              <p className="text-xs text-gray-500">sempre atualizado</p>
            </div>
            <div className="p-4 bg-white rounded-lg border border-gray-100">
              <div className="text-2xl mb-1">🖨️</div>
              <p className="text-sm font-medium text-gray-700">Pronto para imprimir</p>
              <p className="text-xs text-gray-500">formato A4</p>
            </div>
            <div className="p-4 bg-white rounded-lg border border-gray-100">
              <div className="text-2xl mb-1">🎭</div>
              <p className="text-sm font-medium text-gray-700">Sem login</p>
              <p className="text-xs text-gray-500">use agora</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-8 border-t border-gray-200 bg-gray-50 mt-8">
        <div className="container mx-auto px-4 text-center text-gray-600 text-sm">
          <p>© 2025 educando.app — Feito com ❤️ para professores brasileiros</p>
          <p className="mt-1 text-xs text-gray-500">Feito com ❤️ por Lucas Santos Rodrigues</p>
        </div>
      </footer>
    </main>
  )
}

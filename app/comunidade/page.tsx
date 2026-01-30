import Link from "next/link"
import type { Metadata } from "next"
import { getSharedActivities } from "@/lib/activities"
import { Button } from "@/components/ui/button"
import { BookOpen, Sparkles, Users, ArrowLeft } from "lucide-react"
import { CommunityGrid } from "@/components/community-grid"
import { Footer } from "@/components/footer"

export const metadata: Metadata = {
  title: "Comunidade de Professores | educando.app",
  description: "Explore atividades pedagógicas criadas e compartilhadas por professores de todo o Brasil. Uma biblioteca colaborativa de materiais educacionais alinhados à BNCC.",
  keywords: [
    "atividades escolares",
    "materiais pedagógicos",
    "comunidade de professores",
    "educação",
    "BNCC",
    "ensino fundamental",
    "educação infantil",
  ],
  openGraph: {
    title: "Comunidade de Professores | educando.app",
    description: "Explore atividades pedagógicas criadas e compartilhadas por professores de todo o Brasil.",
    type: "website",
    url: "https://educando.app/comunidade",
    siteName: "educando.app",
    locale: "pt_BR",
  },
}

export default async function ComunidadePage() {
  const activities = await getSharedActivities(50)

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

      {/* Hero */}
      <section className="py-12 md:py-16 bg-gradient-to-b from-amber-50 to-white">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto">
            <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Users className="w-8 h-8 text-amber-600" />
            </div>

            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Comunidade de Professores
            </h1>

            <p className="text-lg text-gray-600 max-w-xl mx-auto">
              Explore atividades criadas e compartilhadas por educadores de todo o Brasil.
              Uma biblioteca colaborativa de materiais pedagógicos prontos para usar.
            </p>

            <div className="mt-6 flex flex-wrap justify-center gap-4 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                {activities.length}+ atividades compartilhadas
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                Alinhadas à BNCC
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                Prontas para imprimir
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Grid */}
      <section className="py-8 md:py-12">
        <div className="container mx-auto px-4">
          <CommunityGrid initialActivities={activities} />
        </div>
      </section>

      {/* CTA */}
      <section className="py-12 bg-gradient-to-b from-white to-amber-50">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-2xl mx-auto bg-gradient-to-br from-amber-100 to-amber-50 rounded-2xl p-8 border-2 border-amber-200">
            <Sparkles className="w-10 h-10 text-amber-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Crie sua própria atividade!
            </h2>
            <p className="text-gray-600 mb-6">
              Com o educando.app, você cria atividades pedagógicas personalizadas em apenas 30 segundos.
              Depois, compartilhe com a comunidade para ajudar outros professores.
            </p>
            <Link href="/#gerador">
              <Button size="lg" className="bg-amber-600 hover:bg-amber-700 text-white font-bold">
                <Sparkles className="w-5 h-5 mr-2" />
                Gerar Atividade Grátis
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}

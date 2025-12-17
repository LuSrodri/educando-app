import Link from "next/link"
import { getAllPosts, BlogPost } from "@/lib/blog-posts"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock, ArrowRight, BookOpen, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"

export const metadata = {
  title: "Blog | Educando.app - Dicas para Professores",
  description: "Dicas práticas para professores economizarem tempo, alinharem atividades à BNCC e engajarem seus alunos.",
}

function getCategoryColor(category: BlogPost["category"]) {
  switch (category) {
    case "tempo":
      return "bg-blue-100 text-blue-800 border-blue-200"
    case "bncc":
      return "bg-green-100 text-green-800 border-green-200"
    case "pratico":
      return "bg-purple-100 text-purple-800 border-purple-200"
    default:
      return "bg-gray-100 text-gray-800 border-gray-200"
  }
}

function formatDate(dateString: string) {
  const date = new Date(dateString)
  return date.toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "long",
    year: "numeric"
  })
}

export default function BlogPage() {
  const posts = getAllPosts()

  return (
    <main className="min-h-screen bg-gradient-to-b from-amber-50 via-white to-white">
      {/* Header */}
      <header className="border-b border-amber-200 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl text-gray-900">educando<span className="text-amber-600">.app</span></span>
          </Link>
          <Link href="/">
            <Button className="bg-amber-600 hover:bg-amber-700 text-white">
              <Sparkles className="w-4 h-4 mr-2" />
              Gerar Atividade
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero do Blog */}
      <section className="py-12 md:py-16 border-b border-amber-100">
        <div className="container mx-auto px-4 text-center">
          <Badge className="bg-amber-100 text-amber-800 border-amber-200 mb-4">
            Blog para Professores
          </Badge>
          <h1 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4">
            Dicas para <span className="text-amber-600">facilitar sua rotina</span>
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Artigos práticos sobre planejamento, BNCC e atividades para sala de aula. 
            Economize tempo e tenha mais qualidade de vida.
          </p>
        </div>
      </section>

      {/* Filtros por categoria */}
      <section className="py-6 border-b border-gray-100">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap gap-2 justify-center">
            <Badge className="bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200 transition-colors">
              ⏱️ Economia de Tempo
            </Badge>
            <Badge className="bg-green-100 text-green-800 border-green-200 hover:bg-green-200 transition-colors">
              📚 BNCC
            </Badge>
            <Badge className="bg-purple-100 text-purple-800 border-purple-200 hover:bg-purple-200 transition-colors">
              🎯 Sala de Aula
            </Badge>
          </div>
        </div>
      </section>

      {/* Lista de Posts */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post) => (
              <Link key={post.slug} href={`/blog/${post.slug}`}>
                <Card className="h-full hover:shadow-lg transition-all duration-300 hover:border-amber-300 border-2 border-transparent cursor-pointer group">
                  <CardContent className="p-6 flex flex-col h-full">
                    <div className="flex items-center gap-2 mb-3">
                      <Badge className={`${getCategoryColor(post.category)} text-xs`}>
                        {post.categoryLabel}
                      </Badge>
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {post.readTime}
                      </span>
                    </div>
                    
                    <h2 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-amber-700 transition-colors line-clamp-3">
                      {post.title}
                    </h2>
                    
                    <p className="text-sm text-gray-600 mb-4 flex-grow line-clamp-2">
                      {post.description}
                    </p>
                    
                    <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-100">
                      <span className="text-xs text-gray-500">
                        {formatDate(post.publishedAt)}
                      </span>
                      <span className="text-amber-600 text-sm font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
                        Ler mais <ArrowRight className="w-4 h-4" />
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-12 bg-amber-50 border-t border-amber-100">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
            Pronto para economizar tempo?
          </h2>
          <p className="text-gray-600 mb-6 max-w-xl mx-auto">
            Gere atividades prontas para imprimir em segundos. Alinhadas à BNCC e personalizadas para sua turma.
          </p>
          <Link href="/">
            <Button size="lg" className="bg-amber-600 hover:bg-amber-700 text-white font-bold">
              <Sparkles className="w-5 h-5 mr-2" />
              Experimentar Grátis
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer simples */}
      <footer className="py-8 border-t border-gray-200 bg-white">
        <div className="container mx-auto px-4 text-center text-gray-600 text-sm">
          <p>© 2025 educando.app — Feito com ❤️ para professores brasileiros</p>
        </div>
      </footer>
    </main>
  )
}

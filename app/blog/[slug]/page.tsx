import Link from "next/link"
import { notFound } from "next/navigation"
import { getPostBySlug, getAllPosts, BlogPost } from "@/lib/blog-posts"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Clock, ArrowLeft, BookOpen, Sparkles, Share2 } from "lucide-react"

interface PageProps {
  params: Promise<{ slug: string }>
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

export async function generateStaticParams() {
  const posts = getAllPosts()
  return posts.map((post) => ({
    slug: post.slug,
  }))
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params
  const post = getPostBySlug(slug)
  
  if (!post) {
    return {
      title: "Post não encontrado | Educando.app",
    }
  }

  return {
    title: `${post.title} | Educando.app`,
    description: post.description,
  }
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params
  const post = getPostBySlug(slug)

  if (!post) {
    notFound()
  }

  return (
    <main className="min-h-screen bg-white">
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

      {/* Breadcrumb */}
      <div className="bg-amber-50 border-b border-amber-100">
        <div className="container mx-auto px-4 py-3">
          <Link href="/blog" className="text-amber-700 hover:text-amber-800 text-sm flex items-center gap-1 w-fit">
            <ArrowLeft className="w-4 h-4" />
            Voltar para o Blog
          </Link>
        </div>
      </div>

      {/* Artigo */}
      <article className="py-8 md:py-12">
        <div className="container mx-auto px-4 max-w-3xl">
          {/* Header do artigo */}
          <header className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <Badge className={`${getCategoryColor(post.category)}`}>
                {post.categoryLabel}
              </Badge>
              <span className="text-sm text-gray-500 flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {post.readTime} de leitura
              </span>
            </div>
            
            <h1 className="text-2xl md:text-4xl font-bold text-gray-900 mb-4 leading-tight">
              {post.title}
            </h1>
            
            <p className="text-lg text-gray-600">
              {post.description}
            </p>
            
            <div className="flex items-center gap-4 mt-6 pt-6 border-t border-gray-100">
              <span className="text-sm text-gray-500">
                Publicado em {formatDate(post.publishedAt)}
              </span>
            </div>
          </header>

          {/* Conteúdo */}
          <div className="prose prose-lg max-w-none prose-headings:text-gray-900 prose-headings:font-bold prose-p:text-gray-700 prose-p:leading-relaxed prose-li:text-gray-700 prose-strong:text-gray-900 prose-h2:text-2xl prose-h2:mt-8 prose-h2:mb-4 prose-h3:text-xl prose-h3:mt-6 prose-h3:mb-3 prose-ul:my-4 prose-li:my-1">
            {post.content.split('\n').map((paragraph, index) => {
              const trimmed = paragraph.trim()
              if (!trimmed) return null
              
              if (trimmed.startsWith('## ')) {
                return <h2 key={index} className="text-2xl font-bold text-gray-900 mt-8 mb-4">{trimmed.replace('## ', '')}</h2>
              }
              if (trimmed.startsWith('### ')) {
                return <h3 key={index} className="text-xl font-bold text-gray-900 mt-6 mb-3">{trimmed.replace('### ', '')}</h3>
              }
              if (trimmed.startsWith('- ')) {
                return <li key={index} className="text-gray-700 ml-4">{trimmed.replace('- ', '')}</li>
              }
              
              // Processar negrito
              const parts = trimmed.split(/(\*\*[^*]+\*\*)/g)
              return (
                <p key={index} className="text-gray-700 leading-relaxed mb-4">
                  {parts.map((part, i) => {
                    if (part.startsWith('**') && part.endsWith('**')) {
                      return <strong key={i} className="text-gray-900 font-semibold">{part.slice(2, -2)}</strong>
                    }
                    return part
                  })}
                </p>
              )
            })}
          </div>

          {/* CTA */}
          <Card className="mt-12 border-2 border-amber-400 bg-gradient-to-br from-amber-50 to-amber-100">
            <CardContent className="p-6 md:p-8 text-center">
              <div className="w-12 h-12 bg-amber-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">
                Gostou da dica?
              </h3>
              <p className="text-gray-600 mb-6">
                Clique no botão abaixo para gerar uma atividade sobre esse tema agora mesmo. É grátis!
              </p>
              <Link href="/#gerador">
                <Button size="lg" className="bg-amber-600 hover:bg-amber-700 text-white font-bold">
                  <Sparkles className="w-5 h-5 mr-2" />
                  Gerar Atividade Grátis
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Compartilhar */}
          <div className="mt-8 pt-8 border-t border-gray-200 flex items-center justify-between">
            <Link href="/blog" className="text-amber-700 hover:text-amber-800 font-medium flex items-center gap-1">
              <ArrowLeft className="w-4 h-4" />
              Ver mais artigos
            </Link>
          </div>
        </div>
      </article>

      {/* Footer simples */}
      <footer className="py-8 border-t border-gray-200 bg-gray-50">
        <div className="container mx-auto px-4 text-center text-gray-600 text-sm">
          <p>© 2025 educando.app — Feito com ❤️ para professores brasileiros</p>
        </div>
      </footer>
    </main>
  )
}

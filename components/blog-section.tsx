"use client"

import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Clock, ArrowRight, BookOpen } from "lucide-react"

const featuredPosts = [
  {
    slug: "planejamento-de-aulas-economizar-tempo",
    title: "Planejamento de Aulas: Como economizar até 5 horas da sua semana",
    category: "Produtividade",
    categoryColor: "bg-blue-100 text-blue-800 border-blue-200",
    readTime: "5 min",
  },
  {
    slug: "descomplicando-bncc-alinhar-atividades",
    title: "Descomplicando a BNCC: Alinhe suas atividades sem dor de cabeça",
    category: "BNCC",
    categoryColor: "bg-green-100 text-green-800 border-green-200",
    readTime: "6 min",
  },
  {
    slug: "sala-de-aula-agitada-atividades-concentracao",
    title: "Sala de aula agitada? 5 atividades que ajudam a concentrar a turma",
    category: "Sala de Aula",
    categoryColor: "bg-purple-100 text-purple-800 border-purple-200",
    readTime: "4 min",
  },
]

export function BlogSection() {
  return (
    <section className="py-16 bg-gradient-to-b from-white to-amber-50">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-10">
          <Badge className="bg-amber-100 text-amber-800 border-amber-200 mb-3">
            <BookOpen className="w-3 h-3 mr-1" />
            Blog para Professores
          </Badge>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
            Dicas para facilitar sua rotina
          </h2>
          <p className="text-gray-600 max-w-xl mx-auto">
            Artigos práticos sobre planejamento, BNCC e atividades para economizar seu tempo.
          </p>
        </div>

        {/* Posts em destaque */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {featuredPosts.map((post) => (
            <Link key={post.slug} href={`/blog/${post.slug}`}>
              <Card className="h-full hover:shadow-lg transition-all duration-300 hover:border-amber-300 border-2 border-transparent cursor-pointer group">
                <CardContent className="p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Badge className={`${post.categoryColor} text-xs`}>
                      {post.category}
                    </Badge>
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {post.readTime}
                    </span>
                  </div>
                  
                  <h3 className="font-bold text-gray-900 group-hover:text-amber-700 transition-colors line-clamp-2">
                    {post.title}
                  </h3>
                  
                  <span className="text-amber-600 text-sm font-medium flex items-center gap-1 mt-3 group-hover:gap-2 transition-all">
                    Ler artigo <ArrowRight className="w-4 h-4" />
                  </span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center">
          <Link href="/blog">
            <Button variant="outline" className="border-amber-300 text-amber-700 hover:bg-amber-50">
              Ver todos os artigos
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}

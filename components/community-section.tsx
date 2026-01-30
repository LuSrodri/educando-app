import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Users, ArrowRight, Share2 } from "lucide-react"

export function CommunitySection() {
  return (
    <section className="py-16 bg-gradient-to-b from-white to-amber-50">
      <div className="container mx-auto px-4">
        <Card className="max-w-4xl mx-auto border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-white overflow-hidden">
          <CardContent className="p-8 md:p-12">
            <div className="flex flex-col md:flex-row items-center gap-8">
              {/* Icon */}
              <div className="flex-shrink-0">
                <div className="w-20 h-20 bg-amber-100 rounded-2xl flex items-center justify-center">
                  <Users className="w-10 h-10 text-amber-600" />
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 text-center md:text-left">
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
                  Comunidade de Professores
                </h2>
                <p className="text-gray-600 mb-4 max-w-lg">
                  Explore atividades criadas por outros educadores e inspire-se para suas aulas.
                  Uma biblioteca colaborativa de materiais pedagógicos prontos para usar.
                </p>
                <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-100/50 px-3 py-2 rounded-lg w-fit mx-auto md:mx-0">
                  <Share2 className="w-4 h-4" />
                  <span>Suas atividades compartilhadas aparecem na comunidade</span>
                </div>
              </div>

              {/* CTA */}
              <div className="flex-shrink-0">
                <Link href="/comunidade">
                  <Button size="lg" className="bg-amber-600 hover:bg-amber-700 text-white font-bold">
                    Explorar Comunidade
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}

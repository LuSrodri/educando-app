"use client"

import { CheckCircle, Sparkles, Printer, Clock, BookOpen, Palette } from "lucide-react"

const features = [
  {
    icon: CheckCircle,
    title: "Alinhado à BNCC",
    description: "Todas as atividades incluem competências e habilidades da Base Nacional Comum Curricular.",
    color: "text-green-600 bg-green-100",
  },
  {
    icon: Sparkles,
    title: "Gerado por IA",
    description: "Inteligência artificial especializada em criar atividades pedagógicas de qualidade.",
    color: "text-amber-600 bg-amber-100",
  },
  {
    icon: Clock,
    title: "Pronto em 30 segundos",
    description: "Economize horas de trabalho. Digite o tema e receba a atividade instantaneamente.",
    color: "text-blue-600 bg-blue-100",
  },
  {
    icon: Printer,
    title: "Pronto para imprimir",
    description: "Atividades em alta qualidade, formatadas para impressão em folha A4.",
    color: "text-purple-600 bg-purple-100",
  },
  {
    icon: Palette,
    title: "Visual colorido e atraente",
    description: "Ilustrações vibrantes que engajam os alunos e tornam o aprendizado divertido.",
    color: "text-pink-600 bg-pink-100",
  },
  {
    icon: BookOpen,
    title: "Cultura brasileira",
    description: "Atividades com referências à fauna, flora e cultura do Brasil.",
    color: "text-teal-600 bg-teal-100",
  },
]

export function Features() {
  return (
    <section className="py-16 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Por que usar o <span className="text-amber-600">educando.app</span>?
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Criado por educadores para educadores. Economize tempo e crie materiais de qualidade.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {features.map((feature, index) => (
            <div
              key={index}
              className="flex items-start gap-4 p-5 rounded-xl bg-white border border-border hover:shadow-md transition-shadow"
            >
              <div className={`p-3 rounded-lg ${feature.color}`}>
                <feature.icon className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-1">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

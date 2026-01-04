import { Metadata } from "next"
import { ActivityHistory } from "@/components/activity-history"

export const metadata: Metadata = {
  title: "Historico de Atividades | educando.app",
  description:
    "Veja todas as atividades escolares que voce criou com o educando.app. Acesse suas atividades anteriores, faca edicoes e crie novas versoes.",
  keywords: [
    "historico de atividades",
    "minhas atividades",
    "atividades salvas",
    "educando.app",
  ],
}

export default function HistoricoPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-amber-50/50 to-white">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Historico de Atividades
          </h1>
          <p className="text-gray-600 mt-2">
            Veja todas as atividades que voce criou. Clique em uma atividade para ver detalhes ou criar novas versoes.
          </p>
        </div>
        <ActivityHistory />
      </div>
    </main>
  )
}

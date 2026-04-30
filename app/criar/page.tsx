import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import { Sparkles } from "lucide-react"
import { SiteHeader } from "@/components/site-header"
import { Footer } from "@/components/footer"
import { GenerationForm } from "@/components/criar/generation-form"
import { createSSRServerClient, getCurrentUser } from "@/lib/supabase/ssr-server"

export const metadata: Metadata = {
  title: "Criar atividade | educando.app",
  description: "Gere uma ficha pedagógica personalizada, alinhada à BNCC, em menos de 1 minuto.",
  robots: { index: false, follow: false },
}

export const dynamic = "force-dynamic"

interface PageProps {
  searchParams: Promise<{ tema?: string }>
}

export default async function CriarPage({ searchParams }: PageProps) {
  const params = await searchParams
  const initialTheme = params.tema?.trim().slice(0, 200) ?? ""

  const user = await getCurrentUser()
  if (!user) {
    const next = initialTheme
      ? `/criar?tema=${encodeURIComponent(initialTheme)}`
      : "/criar"
    redirect(`/login?next=${encodeURIComponent(next)}`)
  }

  const supabase = await createSSRServerClient()
  const { data: balance } = await supabase.rpc("current_credit_balance", {
    p_user_id: user.id,
  })

  const saldo = (balance as number | null) ?? 0

  return (
    <>
      <SiteHeader />
      <main className="min-h-screen bg-gradient-to-b from-amber-50 to-white">
        <div className="container mx-auto px-4 py-10 md:py-14">
          <div className="mx-auto max-w-xl">
            <header className="mb-8 text-center">
              <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500 text-white shadow-lg">
                <Sparkles className="h-7 w-7" />
              </div>
              <h1 className="font-heading text-3xl font-bold tracking-tight text-gray-900">
                Criar atividade
              </h1>
              <p className="mt-2 text-sm text-gray-600">
                Descreva o tema e a IA gera uma ficha completa, alinhada à BNCC e à cultura brasileira.
              </p>
              <div className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-white px-3 py-1 text-sm font-medium text-amber-800">
                <Sparkles className="h-3.5 w-3.5" />
                {saldo} crédito{saldo === 1 ? "" : "s"} disponíve{saldo === 1 ? "l" : "is"}
              </div>
            </header>

            <div className="rounded-2xl border border-amber-200 bg-white p-6 shadow-sm">
              <GenerationForm balance={saldo} initialTheme={initialTheme} />
            </div>

            <p className="mt-6 text-center text-xs text-gray-500">
              A atividade gerada aparece no diretório e no seu{" "}
              <Link href="/minha-conta" className="text-amber-700 underline">
                histórico
              </Link>
              . Sem créditos?{" "}
              <Link href="/creditos" className="text-amber-700 underline">
                Comprar mais.
              </Link>
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}

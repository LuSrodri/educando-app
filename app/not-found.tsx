import Link from "next/link"
import type { Metadata } from "next"
import { Compass, Search } from "lucide-react"
import { SiteHeader } from "@/components/site-header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"

export const metadata: Metadata = {
  title: "Página não encontrada",
  description: "O material ou página solicitada não existe no diretório educando.app.",
  robots: { index: false, follow: false },
}

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main className="flex min-h-[70vh] flex-col items-center justify-center bg-gradient-to-b from-amber-50/70 to-white px-4 py-16 text-center">
        <div className="mx-auto max-w-md rounded-3xl border border-amber-200 bg-white p-8 shadow-xl">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-50 text-amber-600">
            <Compass className="h-7 w-7" aria-hidden />
          </div>

          <p className="mt-5 font-heading text-5xl font-bold leading-none text-amber-500">404</p>
          <h1 className="mt-2 font-heading text-2xl font-bold text-gray-900">
            Esse material saiu do plano de aula
          </h1>
          <p className="mt-3 text-sm text-gray-600">
            A página que você procurou não existe, foi movida ou nunca chegou ao diretório. Tente
            buscar por tema, título ou código BNCC na home.
          </p>

          <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Link href="/">
              <Button className="w-full bg-amber-500 text-white hover:bg-amber-600 sm:w-auto">
                Voltar ao diretório
              </Button>
            </Link>
            <Link href="/#materiais">
              <Button
                variant="outline"
                className="w-full border-amber-300 text-amber-700 hover:bg-amber-50 sm:w-auto"
              >
                <Search className="mr-2 h-4 w-4" />
                Buscar um material
              </Button>
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}

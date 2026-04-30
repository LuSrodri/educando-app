import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import { Sparkles } from "lucide-react"
import { SiteHeader } from "@/components/site-header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { CREDIT_PACKS, PACK_ORDER } from "@/lib/credit-packs"
import { createSSRServerClient, getCurrentUser } from "@/lib/supabase/ssr-server"

export const metadata: Metadata = {
  title: "Comprar créditos | educando.app",
  robots: { index: false, follow: false },
}

export const dynamic = "force-dynamic"

export default async function CreditosPage() {
  const user = await getCurrentUser()
  if (!user) redirect("/login?next=/creditos")

  const supabase = await createSSRServerClient()
  const { data: balanceData } = await supabase.rpc("current_credit_balance", {
    p_user_id: user.id,
  })
  const balance = (balanceData as number | null) ?? 0

  return (
    <>
      <SiteHeader />
      <main className="min-h-screen bg-gradient-to-b from-amber-50 to-white">
        <div className="container mx-auto px-4 py-10 md:py-14">
          <div className="mx-auto max-w-4xl">
            <header className="mb-8">
              <Link
                href="/minha-conta"
                className="text-sm text-gray-500 underline-offset-2 hover:text-amber-700 hover:underline"
              >
                ← Minha conta
              </Link>
              <h1 className="mt-3 font-heading text-3xl font-bold text-gray-900 md:text-4xl">
                Comprar créditos
              </h1>
              <p className="mt-2 text-gray-600">
                Pagamento único via Pix. Sem assinatura, sem renovação automática.
              </p>
            </header>

            <div className="mb-10 rounded-2xl border-2 border-amber-200 bg-white p-6 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-sm uppercase tracking-wide text-amber-700">
                    Saldo atual
                  </p>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="font-heading text-4xl font-bold text-gray-900">
                      {balance}
                    </span>
                    <span className="text-gray-500">
                      crédito{balance === 1 ? "" : "s"}
                    </span>
                  </div>
                </div>
                {balance > 0 && (
                  <Button asChild className="bg-amber-600 text-white hover:bg-amber-700">
                    <Link href="/criar">
                      <Sparkles className="h-4 w-4" />
                      Criar atividade
                    </Link>
                  </Button>
                )}
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-3">
              {PACK_ORDER.map((code) => {
                const pack = CREDIT_PACKS[code]
                const isPopular = pack.recommended
                return (
                  <div
                    key={code}
                    className={`relative flex flex-col rounded-2xl border-2 p-7 transition-shadow hover:shadow-xl ${
                      isPopular
                        ? "border-amber-500 bg-amber-500 text-white shadow-lg shadow-amber-200"
                        : "border-amber-200 bg-white text-gray-900"
                    }`}
                  >
                    {isPopular && (
                      <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-gray-950 px-4 py-1 text-xs font-bold uppercase tracking-widest text-amber-400">
                        Recomendado
                      </span>
                    )}

                    <div className="mb-6">
                      <p
                        className={`text-sm font-semibold uppercase tracking-widest ${
                          isPopular ? "text-amber-100" : "text-amber-700"
                        }`}
                      >
                        {pack.label}
                      </p>
                      <p className="mt-2 font-heading text-4xl font-black tracking-tight">
                        {pack.priceLabel}
                      </p>
                      <p
                        className={`mt-1 text-sm ${
                          isPopular ? "text-amber-100" : "text-gray-500"
                        }`}
                      >
                        {pack.credits} créditos · {pack.unitPriceLabel}
                      </p>
                    </div>

                    <p
                      className={`mb-6 text-sm leading-relaxed ${
                        isPopular ? "text-amber-100" : "text-gray-600"
                      }`}
                    >
                      {pack.pitch}
                    </p>

                    <Link
                      href={`/comprar/${pack.code}`}
                      className={`mt-auto block rounded-xl px-6 py-3 text-center text-sm font-bold transition-all ${
                        isPopular
                          ? "bg-white text-amber-700 hover:bg-amber-50"
                          : "bg-amber-500 text-white hover:bg-amber-600"
                      }`}
                    >
                      Comprar {pack.label}
                    </Link>
                  </div>
                )
              })}
            </div>

            <div className="mx-auto mt-8 max-w-2xl rounded-xl border border-amber-200 bg-white p-5">
              <p className="text-xs leading-relaxed text-gray-500">
                Pagamento processado via Pix. Por ser uma empresa internacional, incide IOF
                de 3,5% já embutido nos preços acima — sem surpresas no app do seu banco. O
                processador parceiro é o{" "}
                <a
                  href="https://www.ebanx.com/pt-br/legal/consumidores/brasil/termos-para-processar-pagamentos/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-amber-700 underline"
                >
                  Ebanx
                </a>
                , e é esse nome que aparece no seu extrato. Créditos têm validade de 12
                meses a partir da compra. Em caso de arrependimento sem uso, reembolso
                integral em até 7 dias — veja os{" "}
                <Link href="/termos" className="text-amber-700 underline">
                  Termos de Uso
                </Link>
                .
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}

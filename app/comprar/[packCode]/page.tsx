import type { Metadata } from "next"
import { notFound, redirect } from "next/navigation"
import { SiteHeader } from "@/components/site-header"
import { Footer } from "@/components/footer"
import { CheckoutForm } from "@/components/pagamento/checkout-form"
import { IofDisclosure } from "@/components/pagamento/iof-disclosure"
import { getPack } from "@/lib/credit-packs"
import { createSSRServerClient, getCurrentUser } from "@/lib/supabase/ssr-server"

export const metadata: Metadata = {
  title: "Finalizar compra | educando.app",
  description: "Confirme seus dados para gerar o Pix.",
  robots: { index: false, follow: false },
}

export const dynamic = "force-dynamic"

interface PageProps {
  params: Promise<{ packCode: string }>
}

export default async function ComprarPage({ params }: PageProps) {
  const { packCode } = await params
  const pack = getPack(packCode)
  if (!pack) notFound()

  const user = await getCurrentUser()
  if (!user) redirect(`/login?next=/comprar/${packCode}`)

  // Pré-preenche o nome a partir do profile, se existir.
  const supabase = await createSSRServerClient()
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .maybeSingle()

  return (
    <>
      <SiteHeader />
      <main className="min-h-screen bg-gradient-to-b from-amber-50 to-white">
        <div className="container mx-auto px-4 py-10 md:py-14">
          <div className="mx-auto max-w-md">
            <header className="mb-8 text-center">
              <p className="text-sm font-medium uppercase tracking-wide text-amber-700">
                Pacote {pack.label}
                {pack.recommended && (
                  <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800">
                    Recomendado
                  </span>
                )}
              </p>
              <h1 className="mt-1 font-heading text-3xl font-bold text-gray-900">
                {pack.priceLabel}
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                {pack.credits} créditos · {pack.unitPriceLabel}
              </p>
            </header>

            <div className="rounded-2xl border border-amber-200 bg-white p-6 shadow-sm">
              <CheckoutForm
                packCode={pack.code}
                packLabel={pack.label}
                priceLabel={pack.priceLabel}
                defaultName={profile?.full_name ?? user.user_metadata?.full_name ?? ""}
              />

              <div className="mt-6 border-t border-amber-100 pt-4">
                <IofDisclosure />
              </div>
            </div>

            <p className="mt-6 text-center text-xs text-gray-500">
              Pagamento processado com segurança pela Stripe + Ebanx. Não armazenamos seus dados bancários.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}

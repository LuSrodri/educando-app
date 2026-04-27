import type { Metadata } from "next"
import { notFound, redirect } from "next/navigation"
import { SiteHeader } from "@/components/site-header"
import { Footer } from "@/components/footer"
import { IofDisclosure } from "@/components/pagamento/iof-disclosure"
import { PixQrDisplay } from "@/components/pagamento/pix-qr-display"
import { CREDIT_PACKS } from "@/lib/credit-packs"
import { getStripe } from "@/lib/stripe"
import { createSSRServerClient, getCurrentUser } from "@/lib/supabase/ssr-server"

export const metadata: Metadata = {
  title: "Pagamento Pix | educando.app",
  description: "Pague com Pix para receber seus créditos no educando.app.",
  robots: { index: false, follow: false },
}

// Esta rota lê e refresca uma sessão; nunca pode ser cacheada estaticamente.
export const dynamic = "force-dynamic"

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function PagamentoPage({ params }: PageProps) {
  const { id } = await params

  const user = await getCurrentUser()
  if (!user) redirect(`/login?next=/pagamento/${id}`)

  const supabase = await createSSRServerClient()
  const { data: payment, error } = await supabase
    .from("payment_intents")
    .select("id, status, stripe_payment_intent_id, pack_code, credits_amount, amount_brl_cents, expires_at")
    .eq("id", id)
    .maybeSingle()

  if (error || !payment) notFound()

  if (payment.status === "paid") {
    redirect("/minha-conta?compra=sucesso")
  }

  const pack = CREDIT_PACKS[payment.pack_code]

  // Pix expira em até 30min; status sai do "pending" via webhook. Se já passou
  // do prazo e o webhook ainda não rodou, o estado mostrado ao usuário é
  // "expirado" pelo countdown — depois o webhook reconcilia o status do DB.
  const stripe = getStripe()
  const pi = await stripe.paymentIntents.retrieve(payment.stripe_payment_intent_id!)
  const qr = pi.next_action?.pix_display_qr_code

  if (!qr) {
    // PaymentIntent já foi finalizado em algum estado terminal (paid/canceled).
    // Volta pra "minha-conta" — o webhook eventualmente atualiza o status.
    redirect("/minha-conta")
  }

  // image_url_svg é uma URL pública servida pela Stripe; usamos diretamente.
  const qrSvgDataUrl = qr.image_url_svg ?? qr.image_url_png ?? ""
  const pixCopyPaste = qr.data ?? ""
  const expiresAt = qr.expires_at
    ? new Date(qr.expires_at * 1000).toISOString()
    : payment.expires_at ?? new Date(Date.now() + 30 * 60 * 1000).toISOString()

  return (
    <>
      <SiteHeader />
      <main className="min-h-screen bg-gradient-to-b from-amber-50 to-white">
        <div className="container mx-auto px-4 py-10 md:py-14">
          <div className="mx-auto max-w-xl">
            <header className="mb-8 text-center">
              <p className="text-sm font-medium uppercase tracking-wide text-amber-700">
                Pacote {pack.label}
              </p>
              <h1 className="mt-1 font-heading text-3xl font-bold text-gray-900">
                {pack.priceLabel}{" "}
                <span className="text-base font-normal text-gray-500">
                  · {pack.credits} créditos
                </span>
              </h1>
              <p className="mt-2 text-sm text-gray-600">
                Pague com Pix em qualquer banco brasileiro — os créditos caem na sua conta automaticamente.
              </p>
            </header>

            <PixQrDisplay
              paymentId={payment.id}
              qrSvgDataUrl={qrSvgDataUrl}
              pixCopyPaste={pixCopyPaste}
              expiresAt={expiresAt}
              successPath="/minha-conta?compra=sucesso"
            />

            <div className="mt-8 rounded-xl border border-amber-100 bg-amber-50/50 p-4">
              <IofDisclosure />
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}

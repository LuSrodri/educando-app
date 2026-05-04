import type { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"
import { redirect } from "next/navigation"
import { Sparkles, BookOpen, Download, CheckCircle2, ChevronDown, CirclePercent } from "lucide-react"
import { SiteHeader } from "@/components/site-header"
import { Footer } from "@/components/footer"
import { getAllActivities } from "@/lib/activities"
import { getActivityImageUrl } from "@/lib/image-utils"
import { generateMaterialSlug } from "@/lib/slug"
import { CREDIT_PACKS, PACK_ORDER } from "@/lib/credit-packs"
import { getCurrentUser, createSSRServerClient } from "@/lib/supabase/ssr-server"

export const metadata: Metadata = {
  title: "Torna-se membro | educando.app",
  description:
    "Gere fichas pedagógicas personalizadas, alinhadas à BNCC e à cultura brasileira, em menos de 1 minuto.",
  alternates: { canonical: "https://educando.app/sejamembro" },
}

export const dynamic = "force-dynamic"

const STEPS = [
  {
    n: "01",
    icon: BookOpen,
    title: "Digite o tema",
    desc: 'Escreva o assunto da aula — ex.: "Frações 4º ano" ou "Animais do Cerrado".',
  },
  {
    n: "02",
    icon: Sparkles,
    title: "A IA pesquisa e gera",
    desc: "O sistema consulta referências pedagógicas, monta a especificação e gera a ficha completa.",
  },
  {
    n: "03",
    icon: Download,
    title: "Baixe e use em aula",
    desc: "Em ~60 segundos sua ficha personalizada está pronta pra imprimir ou projetar.",
  },
]

const FAQS = [
  {
    q: "Quanto tempo demora pra gerar uma atividade?",
    a: "Em média 60 segundos. A IA faz pesquisa em fontes pedagógicas, elabora a estrutura e renderiza a ficha em alta resolução (A4, 300 DPI) — tudo automaticamente.",
  },
  {
    q: "Posso usar o material gerado em sala de aula?",
    a: "Sim, sem restrições. Ao adquirir créditos, você recebe licença ampla e perpétua para uso pedagógico: imprimir, fotocopiar para os alunos, incluir em planos de aula. A única restrição é revenda comercial.",
  },
  {
    q: "E se eu não gostar do resultado?",
    a: "Se nenhum crédito do pacote foi utilizado, você pode solicitar reembolso integral em até 7 dias — conforme o Código de Defesa do Consumidor. Depois de usar qualquer crédito, o serviço é considerado entregue. Consulte os Termos de Uso para detalhes.",
  },
  {
    q: "Os créditos têm prazo de validade?",
    a: "Sim. Cada pacote tem validade de 12 meses a partir da data de compra. Você recebe um e-mail quando os créditos estiverem próximos do vencimento.",
  },
  {
    q: 'O que é o IOF e por que aparece "Ebanx" no extrato?',
    a: 'O educando.app opera como empresa internacional (EUA). O Banco Central exige que compras internacionais pagas em Pix incluam IOF de 3,5% — esse valor já está embutido nos preços exibidos, sem surpresas. O "Ebanx" é o parceiro processador da Stripe para pagamentos no Brasil; é o nome que aparece no seu extrato bancário.',
  },
]

interface PageProps {
  searchParams: Promise<{ tema?: string }>
}

export default async function SejamebroPage({ searchParams }: PageProps) {
  const params = await searchParams
  const tema = params.tema?.trim().slice(0, 200)
  const user = await getCurrentUser()

  if (user) {
    const supabase = await createSSRServerClient()
    const { data: balance } = await supabase.rpc("current_credit_balance", {
      p_user_id: user.id,
    })
    if (((balance as number | null) ?? 0) > 0) {
      redirect(tema ? `/criar?tema=${encodeURIComponent(tema)}` : "/criar")
    }
  }

  const sampleActivities = await getAllActivities(3)

  return (
    <>
      <SiteHeader hideCta />

      <main>
        {/* ─── HERO ───────────────────────────────────────────────────────────── */}
        <section className="relative overflow-hidden bg-amber-50">
          {/* Decorative grid */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-[0.035]"
            style={{
              backgroundImage:
                "linear-gradient(to right, #92400e 1px, transparent 1px), linear-gradient(to bottom, #92400e 1px, transparent 1px)",
              backgroundSize: "40px 40px",
            }}
          />

          <div className="container relative mx-auto px-4 py-20 md:py-28 lg:py-32">
            <div className="mx-auto max-w-3xl text-center">
              <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-amber-300 bg-white px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-amber-700 shadow-sm">
                <Sparkles className="h-3.5 w-3.5" />
                Fichas geradas por IA pedagógica
              </span>

              <h1 className="font-heading text-4xl font-black leading-[1.05] tracking-tight text-gray-950 sm:text-5xl md:text-6xl lg:text-7xl">
                Fichas pedagógicas{" "}
                <span className="relative whitespace-nowrap">
                  <span className="relative z-10 text-amber-600">prontas</span>
                  <svg
                    aria-hidden
                    viewBox="0 0 220 12"
                    className="absolute -bottom-1 left-0 w-full"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M2 9.5C50 3 120 2 218 9.5"
                      stroke="#f59e0b"
                      strokeWidth="4"
                      strokeLinecap="round"
                    />
                  </svg>
                </span>{" "}
                em 60 segundos
              </h1>

              <p className="mx-auto mt-7 max-w-xl text-lg leading-relaxed text-gray-700">
                Alinhadas à BNCC, com referências culturais brasileiras, personalizadas pro seu tema e faixa etária — sem gastar horas preparando aulas.
              </p>

              <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <a
                  href="#precos"
                  className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-7 py-3.5 text-base font-bold text-white shadow-lg transition-all hover:bg-amber-600 hover:shadow-amber-200 hover:shadow-xl"
                >
                  Ver pacotes
                  <CirclePercent className="h-4 w-4" />
                </a>
                <Link
                  href="/#materiais"
                  className="inline-flex items-center gap-1.5 px-4 py-3.5 text-sm font-medium text-gray-600 underline-offset-2 hover:text-amber-700 hover:underline"
                >
                  Ver atividades gratuitas
                </Link>
              </div>

              <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-sm text-gray-500">
                {["Alinhado à BNCC", "Cultura brasileira", "Sem anúncios", "Uso livre em sala"].map((feat) => (
                  <span key={feat} className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    {feat}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom wave */}
          <div className="h-8 bg-white" style={{ clipPath: "ellipse(55% 100% at 50% 100%)" }} />
        </section>

        {/* ─── HOW IT WORKS ────────────────────────────────────────────────────── */}
        <section className="bg-white py-20">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="font-heading text-3xl font-black tracking-tight text-gray-950 md:text-4xl">
                Como funciona
              </h2>
              <p className="mt-3 text-gray-600">Três passos. Menos de 1 minuto.</p>
            </div>

            <div className="mx-auto mt-14 grid max-w-4xl gap-6 sm:grid-cols-3">
              {STEPS.map(({ n, icon: Icon, title, desc }) => (
                <div
                  key={n}
                  className="group relative rounded-2xl border border-amber-100 bg-amber-50/60 p-7 transition-shadow hover:shadow-lg"
                >
                  <span className="font-heading text-5xl font-black leading-none text-amber-200 select-none">
                    {n}
                  </span>
                  <div className="mt-3 flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500 text-white shadow">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 font-heading text-lg font-bold text-gray-900">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-gray-600">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── SAMPLE ACTIVITIES ───────────────────────────────────────────────── */}
        {sampleActivities.length > 0 && (
          <section className="bg-white py-20">
            <div className="container mx-auto px-4">
              <div className="mx-auto mb-12 max-w-2xl text-center">
                <span className="mb-3 inline-block rounded-full border border-amber-500/30 bg-amber-50 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-amber-600">
                  Exemplos reais
                </span>
                <h2 className="font-heading text-3xl font-black tracking-tight text-gray-900 md:text-4xl">
                  Veja o que a IA gera
                </h2>
                <p className="mt-3 text-gray-500">
                  Fichas do diretório público — geradas pelo mesmo sistema que você vai usar.
                </p>
              </div>

              <div className="mx-auto grid max-w-5xl gap-5 sm:grid-cols-3">
                {sampleActivities.map((activity) => {
                  const slug = generateMaterialSlug(activity.theme, activity.id)
                  const imageUrl = getActivityImageUrl(activity.image_path)
                  return (
                    <Link
                      key={activity.id}
                      href={`/material/${slug}`}
                      className="group overflow-hidden rounded-2xl border border-gray-200 bg-gray-50 transition-all hover:border-amber-400/60 hover:bg-amber-50"
                    >
                      <div className="aspect-[3/4] overflow-hidden">
                        <Image
                          src={imageUrl}
                          alt={activity.title ?? "Atividade pedagógica"}
                          width={400}
                          height={534}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      </div>
                      <div className="p-4">
                        {activity.theme && (
                          <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-amber-600">
                            {activity.theme}
                          </p>
                        )}
                        <p className="line-clamp-2 text-sm font-semibold text-gray-900">
                          {activity.title}
                        </p>
                      </div>
                    </Link>
                  )
                })}
              </div>

              <p className="mt-8 text-center text-sm text-gray-500">
                <Link href="/" className="text-amber-600 underline-offset-2 hover:underline">
                  Ver todo o diretório gratuito →
                </Link>
              </p>
            </div>
          </section>
        )}

        {/* ─── PRICING ─────────────────────────────────────────────────────────── */}
        <section id="precos" className="bg-amber-50 py-20">
          <div className="container mx-auto px-4">
            <div className="mx-auto mb-12 max-w-2xl text-center">
              <h2 className="font-heading text-3xl font-black tracking-tight text-gray-950 md:text-4xl">
                Escolha seu pacote
              </h2>
              <p className="mt-3 text-gray-600">
                Pagamento único via Pix. Sem assinatura, sem renovação automática.
              </p>
            </div>

            <div className="mx-auto grid max-w-4xl gap-5 sm:grid-cols-3">
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
                        className={`text-sm font-semibold uppercase tracking-widest ${isPopular ? "text-amber-100" : "text-amber-700"}`}
                      >
                        {pack.label}
                      </p>
                      <p className="mt-2 font-heading text-4xl font-black tracking-tight">
                        {pack.priceLabel}
                      </p>
                      <p className={`mt-1 text-sm ${isPopular ? "text-amber-100" : "text-gray-500"}`}>
                        {pack.credits} créditos · {pack.unitPriceLabel}
                      </p>
                    </div>

                    <p className={`mb-6 text-sm leading-relaxed ${isPopular ? "text-amber-100" : "text-gray-600"}`}>
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

            <div className="mx-auto mt-8 max-w-xl rounded-xl border border-amber-200 bg-white p-5">
              <p className="text-xs leading-relaxed text-gray-500">
                Pagamento processado via Pix. Por ser uma empresa internacional, incide IOF de 3,5%
                já embutido nos preços acima — sem surpresas no app do seu banco. O processador
                parceiro é o{" "}
                <a
                  href="https://www.ebanx.com/pt-br/legal/consumidores/brasil/termos-para-processar-pagamentos/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-amber-700 underline"
                >
                  Ebanx
                </a>
                , e é esse nome que aparece no seu extrato. Em caso de arrependimento sem uso, reembolso integral
                em até 7 dias — veja os{" "}
                <Link href="/termos" className="text-amber-700 underline">
                  Termos de Uso
                </Link>
                .
              </p>
            </div>
          </div>
        </section>

        {/* ─── FAQ ─────────────────────────────────────────────────────────────── */}
        <section className="bg-white py-20">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-2xl">
              <h2 className="mb-10 font-heading text-3xl font-black tracking-tight text-gray-950 md:text-4xl">
                Dúvidas frequentes
              </h2>

              <div className="divide-y divide-gray-100">
                {FAQS.map(({ q, a }) => (
                  <details key={q} className="group py-5">
                    <summary className="flex cursor-pointer list-none items-start justify-between gap-4 text-base font-semibold text-gray-900 marker:hidden">
                      {q}
                      <ChevronDown className="mt-0.5 h-5 w-5 shrink-0 text-amber-500 transition-transform group-open:rotate-180" />
                    </summary>
                    <p className="mt-3 text-sm leading-relaxed text-gray-600">{a}</p>
                  </details>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ─── FOOTER CTA ──────────────────────────────────────────────────────── */}
        <section className="bg-amber-500 py-16">
          <div className="container mx-auto px-4 text-center">
            <h2 className="font-heading text-3xl font-black tracking-tight text-white md:text-4xl">
              Comece hoje. Sua próxima aula agradece.
            </h2>
            <p className="mx-auto mt-4 max-w-md text-amber-100">
              Sem assinatura. Sem burocracia. Pague uma vez, use quando precisar.
            </p>
            <a
              href="#precos"
              className="mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-8 py-4 text-base font-bold text-amber-700 shadow-lg transition-all hover:bg-amber-50 hover:shadow-xl"
            >
              Ver pacotes
              <CirclePercent className="h-4 w-4" />
            </a>
          </div>
        </section>
      </main>

      <Footer />
    </>
  )
}

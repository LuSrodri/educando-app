import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { redirect } from "next/navigation"
import { Bookmark, BookOpen, Crown, Gift, LogOut, Sparkles } from "lucide-react"
import { SiteHeader } from "@/components/site-header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import {
  CancelSubscriptionButton,
  ReactivateSubscriptionButton,
  SubscribeButton,
} from "@/components/payments/subscription-actions"
import { createSSRServerClient, getCurrentUser } from "@/lib/supabase/ssr-server"
import { createServerClient } from "@/lib/supabase/server"
import { getActivityImageUrl, isPersonalizedImage } from "@/lib/image-utils"
import { generateMaterialSlug } from "@/lib/slug"
import { getStripe } from "@/lib/stripe"
import { syncSubscriptionToDb } from "@/lib/stripe-subscription-utils"
import { getSubscriptionState } from "@/lib/subscriptions"
import { PREMIUM_MONTHLY } from "@/lib/subscription-config"
import { signOutAction } from "./actions"

export const metadata: Metadata = {
  title: "Minha conta | educando.app",
  robots: { index: false, follow: false },
}

export const dynamic = "force-dynamic"

interface PageProps {
  searchParams: Promise<{ compra?: string; assinatura?: string; session_id?: string }>
}

/**
 * Race condition: Stripe redireciona o usuário pro return_url assim que o
 * pagamento confirma, mas o webhook (customer.subscription.created) pode
 * chegar segundos depois. Se a gente só ler a tabela local, o usuário vê
 * "ainda não tem assinatura" mesmo tendo acabado de pagar.
 *
 * Solução: quando o redirect inclui session_id, busca a sessão direto na
 * Stripe e força um sync da Subscription pro nosso DB antes de renderizar.
 * Idempotente — se o webhook já chegou, o upsert é no-op.
 */
async function reconcileFromCheckoutSession(sessionId: string): Promise<void> {
  try {
    const stripe = getStripe()
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["subscription"],
    })
    if (session.status !== "complete" || !session.subscription) return

    const subscription =
      typeof session.subscription === "string"
        ? await stripe.subscriptions.retrieve(session.subscription)
        : session.subscription

    const admin = createServerClient()
    await syncSubscriptionToDb(admin, subscription)
  } catch (err) {
    console.error("[minha-conta] reconcile failed:", (err as Error).message)
    // Não bloqueia — o webhook eventualmente sincroniza.
  }
}

function formatDateBr(dateString: string | null): string {
  if (!dateString) return ""
  return new Date(dateString).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  })
}

export default async function MinhaContaPage({ searchParams }: PageProps) {
  const params = await searchParams
  const showCreditsSuccess = params.compra === "sucesso"
  const showSubscriptionSuccess = params.assinatura === "ativada"

  const user = await getCurrentUser()
  if (!user) redirect("/criar?login=1&next=/minha-conta")

  // Se veio do checkout da Stripe, sincroniza ANTES de ler o estado local.
  // Cobre o gap até o webhook chegar.
  if (params.session_id && params.session_id.startsWith("cs_")) {
    await reconcileFromCheckoutSession(params.session_id)
  }

  const supabase = await createSSRServerClient()

  const [
    { data: balanceData },
    { data: ledger },
    { data: userActivities },
    { subscription, isPremium },
  ] = await Promise.all([
    supabase.rpc("current_credit_balance", { p_user_id: user.id }),
    supabase
      .from("credit_ledger")
      .select("id, delta, kind, reason, created_at")
      .order("created_at", { ascending: false })
      .limit(10),
    supabase
      .from("activities")
      .select("id, title, theme, type, image_path, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(12),
    getSubscriptionState(supabase, user.id),
  ])

  // Atividades salvas — só carrega se o usuário é premium ativo.
  let savedItems: Array<{
    id: string
    title: string | null
    theme: string | null
    image_path: string
    saved_at: string
  }> = []
  if (isPremium) {
    const { data: saved } = await supabase
      .from("saved_activities")
      .select(
        "created_at, activities(id, title, theme, image_path)",
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(24)
    savedItems =
      saved
        ?.map((row) => {
          // activities pode vir como objeto único quando a FK é to-one.
          const a = (row as { activities: { id: string; title: string | null; theme: string | null; image_path: string } | null }).activities
          if (!a) return null
          return {
            id: a.id,
            title: a.title,
            theme: a.theme,
            image_path: a.image_path,
            saved_at: (row as { created_at: string }).created_at,
          }
        })
        .filter((x): x is NonNullable<typeof x> => x !== null) ?? []
  }

  const balance = (balanceData as number | null) ?? 0
  const fullName =
    (user.user_metadata?.full_name as string | undefined) ?? user.email ?? "Você"

  // Signed URLs para imagens personalizadas privadas.
  const signedUrlMap = new Map<string, string>()
  if (userActivities && userActivities.length > 0) {
    const privatePaths = userActivities
      .map((a) => a.image_path)
      .filter((p): p is string => typeof p === "string" && isPersonalizedImage(p))
    if (privatePaths.length > 0) {
      const admin = createServerClient()
      const { data: signed } = await admin.storage
        .from("personalized")
        .createSignedUrls(privatePaths, 3600)
      signed?.forEach(({ path, signedUrl }) => {
        if (path && signedUrl) signedUrlMap.set(path, signedUrl)
      })
    }
  }

  return (
    <>
      <SiteHeader />
      <main className="min-h-screen bg-gradient-to-b from-amber-50 to-white">
        <div className="container mx-auto px-4 py-10 md:py-14">
          <div className="mx-auto max-w-3xl">
            {showCreditsSuccess && (
              <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                <p className="font-heading font-semibold text-emerald-900">
                  Compra confirmada — créditos liberados!
                </p>
                <p className="mt-1 text-sm text-emerald-800">
                  Você já pode gerar atividades agora mesmo.
                </p>
              </div>
            )}
            {showSubscriptionSuccess && (
              <div className="mb-6 rounded-xl border border-amber-300 bg-amber-50 p-4">
                <p className="font-heading font-semibold text-amber-900">
                  {subscription?.status === "trialing"
                    ? "Seu teste grátis começou — aproveite!"
                    : "Assinatura ativa! Bem-vindo ao Premium."}
                </p>
                <p className="mt-1 text-sm text-amber-800">
                  {subscription?.status === "trialing"
                    ? `Você tem acesso total até ${formatDateBr(subscription.current_period_end)}. Cancele antes dessa data e não pague nada.`
                    : "Baixe, imprima e salve atividades sem limites."}
                </p>
              </div>
            )}

            <header className="mb-8 flex items-start justify-between gap-4">
              <div>
                <p className="text-sm text-gray-500">Olá,</p>
                <h1 className="font-heading text-3xl font-bold text-gray-900">{fullName}</h1>
              </div>
              <form action={signOutAction}>
                <Button
                  type="submit"
                  variant="ghost"
                  size="sm"
                  className="text-gray-600 hover:text-gray-900"
                >
                  <LogOut className="h-4 w-4" />
                  Sair
                </Button>
              </form>
            </header>

            {/* Assinatura Premium */}
            <section className="mb-8">
              <h2 className="mb-3 font-heading text-xl font-semibold text-gray-900">
                Assinatura Premium
              </h2>

              {subscription && isPremium ? (
                (() => {
                  const isTrialing = subscription.status === "trialing"
                  const badge = subscription.cancel_at_period_end
                    ? { label: "Cancelamento agendado", className: "bg-gray-100 text-gray-800", Icon: Crown }
                    : isTrialing
                      ? { label: "Em teste grátis", className: "bg-amber-600 text-white", Icon: Gift }
                      : { label: "Premium ativa", className: "bg-amber-100 text-amber-900", Icon: Crown }
                  const Icon = badge.Icon
                  const periodLabel = subscription.cancel_at_period_end
                    ? `Acesso até ${formatDateBr(subscription.current_period_end)}.`
                    : isTrialing
                      ? `Teste grátis até ${formatDateBr(subscription.current_period_end)} — primeira cobrança nessa data.`
                      : `Próxima cobrança em ${formatDateBr(subscription.current_period_end)}.`
                  return (
                    <div className="rounded-2xl border-2 border-amber-300 bg-gradient-to-br from-amber-50 to-white p-6 shadow-sm">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className={`mb-1 inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${badge.className}`}>
                            <Icon className="h-3.5 w-3.5" />
                            {badge.label}
                          </div>
                          <p className="font-heading text-2xl font-bold text-gray-900">
                            {PREMIUM_MONTHLY.priceLabel}/{PREMIUM_MONTHLY.intervalLabel}
                          </p>
                          <p className="mt-1 text-sm text-gray-600">{periodLabel}</p>
                        </div>
                      </div>
                      <div className="mt-5 flex flex-wrap gap-3">
                        {subscription.cancel_at_period_end ? (
                          <ReactivateSubscriptionButton />
                        ) : (
                          <CancelSubscriptionButton isTrialing={isTrialing} />
                        )}
                      </div>
                    </div>
                  )
                })()
              ) : (
                <div className="rounded-2xl border-2 border-amber-200 bg-white p-6 shadow-sm">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-heading text-lg font-semibold text-gray-900">
                        Desbloqueie download, impressão e salvos
                      </p>
                      <p className="mt-1 text-sm text-gray-600">
                        Grátis nos primeiros 7 dias · depois{" "}
                        {PREMIUM_MONTHLY.priceLabel}/{PREMIUM_MONTHLY.intervalLabel} · cancele
                        quando quiser
                      </p>
                    </div>
                    <SubscribeButton />
                  </div>
                </div>
              )}
            </section>

            {/* Atividades salvas — só pra assinantes */}
            {isPremium && (
              <section className="mb-10">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="flex items-center gap-2 font-heading text-xl font-semibold text-gray-900">
                    <Bookmark className="h-5 w-5 text-amber-600" />
                    Salvos
                  </h2>
                  {savedItems.length > 0 && (
                    <span className="text-sm text-gray-500">
                      {savedItems.length} item{savedItems.length === 1 ? "" : "s"}
                    </span>
                  )}
                </div>

                {savedItems.length === 0 ? (
                  <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-amber-200 bg-white p-10 text-center">
                    <Bookmark className="mb-3 h-9 w-9 text-amber-200" />
                    <p className="font-heading font-semibold text-gray-700">
                      Você ainda não salvou nenhuma atividade.
                    </p>
                    <p className="mt-1 text-sm text-gray-500">
                      Clique em <strong>Salvar</strong> em qualquer atividade do diretório.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                    {savedItems.map((item) => {
                      const slug = generateMaterialSlug(item.theme, item.id)
                      const imageUrl = getActivityImageUrl(item.image_path)
                      return (
                        <Link
                          key={item.id}
                          href={`/material/${slug}`}
                          className="group overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-all hover:border-amber-300 hover:shadow-md"
                        >
                          <div className="aspect-[3/4] overflow-hidden bg-amber-50">
                            <Image
                              src={imageUrl}
                              alt={item.title ?? "Atividade salva"}
                              width={300}
                              height={400}
                              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                          </div>
                          <div className="p-3">
                            {item.theme && (
                              <p className="mb-0.5 truncate text-[10px] font-semibold uppercase tracking-widest text-amber-700">
                                {item.theme}
                              </p>
                            )}
                            <p className="line-clamp-2 text-xs font-medium text-gray-800">
                              {item.title}
                            </p>
                          </div>
                        </Link>
                      )
                    })}
                  </div>
                )}
              </section>
            )}

            {/* Saldo de créditos (separado da assinatura) */}
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 font-heading text-xl font-semibold text-gray-900">
                <Sparkles className="h-5 w-5 text-amber-600" />
                Gerar atividades com IA
              </h2>
            </div>
            <div className="rounded-2xl border-2 border-amber-200 bg-white p-6 shadow-sm">
              <p className="text-sm uppercase tracking-wide text-amber-700">Saldo de créditos</p>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="font-heading text-5xl font-bold text-gray-900">{balance}</span>
                <span className="text-gray-500">crédito{balance === 1 ? "" : "s"}</span>
              </div>
              <p className="mt-2 text-xs text-gray-500">
                Créditos servem para gerar atividades personalizadas via IA. São independentes da
                assinatura Premium.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                {balance > 0 && (
                  <Button asChild className="bg-amber-600 text-white hover:bg-amber-700">
                    <Link href="/criar">
                      <Sparkles className="h-4 w-4" />
                      Criar atividade
                    </Link>
                  </Button>
                )}
                <Button asChild variant="outline">
                  <Link href="/criar?creditos=1">Comprar créditos</Link>
                </Button>
              </div>
            </div>

            {/* Atividades geradas pelo user */}
            <section className="mt-10">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-heading text-xl font-semibold text-gray-900">
                  Minhas atividades
                </h2>
                {userActivities && userActivities.length > 0 && (
                  <span className="text-sm text-gray-500">
                    {userActivities.length} gerada{userActivities.length === 1 ? "" : "s"}
                  </span>
                )}
              </div>

              {!userActivities || userActivities.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-amber-200 bg-white p-12 text-center">
                  <BookOpen className="mb-3 h-10 w-10 text-amber-200" />
                  <p className="font-heading font-semibold text-gray-700">
                    Nenhuma atividade gerada ainda.
                  </p>
                  <p className="mt-1 text-sm text-gray-500">
                    Use seus créditos para criar fichas pedagógicas personalizadas.
                  </p>
                  {balance > 0 && (
                    <Button asChild className="mt-5 bg-amber-600 text-white hover:bg-amber-700">
                      <Link href="/criar">
                        <Sparkles className="h-4 w-4" />
                        Criar primeira atividade
                      </Link>
                    </Button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                  {userActivities.map((activity) => {
                    const slug = generateMaterialSlug(activity.theme, activity.id)
                    const imageUrl =
                      (activity.image_path && signedUrlMap.get(activity.image_path)) ??
                      getActivityImageUrl(activity.image_path ?? "")
                    return (
                      <Link
                        key={activity.id}
                        href={`/personalizado/${slug}`}
                        className="group overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-all hover:border-amber-300 hover:shadow-md"
                      >
                        <div className="aspect-[3/4] overflow-hidden bg-amber-50">
                          <Image
                            src={imageUrl}
                            alt={activity.title ?? "Atividade"}
                            width={300}
                            height={400}
                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                        </div>
                        <div className="p-3">
                          {activity.theme && (
                            <p className="mb-0.5 truncate text-[10px] font-semibold uppercase tracking-widest text-amber-700">
                              {activity.theme}
                            </p>
                          )}
                          <p className="line-clamp-2 text-xs font-medium text-gray-800">
                            {activity.title}
                          </p>
                          <p className="mt-1 text-[10px] text-gray-400">
                            {new Date(activity.created_at ?? "").toLocaleDateString("pt-BR", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })}
                          </p>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              )}
            </section>

            {/* Histórico de créditos */}
            <section className="mt-10">
              <h2 className="mb-4 font-heading text-xl font-semibold text-gray-900">
                Histórico de créditos
              </h2>
              {!ledger || ledger.length === 0 ? (
                <p className="rounded-md border border-dashed border-gray-200 bg-white p-6 text-sm text-gray-500">
                  Sem movimentações ainda.
                </p>
              ) : (
                <ul className="divide-y divide-gray-100 rounded-2xl border border-gray-200 bg-white">
                  {ledger.map((entry) => {
                    const positive = entry.delta > 0
                    const date = new Date(entry.created_at).toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })
                    return (
                      <li key={entry.id} className="flex items-center justify-between px-5 py-3">
                        <div>
                          <p className="text-sm font-medium text-gray-800">
                            {entry.reason ?? entry.kind}
                          </p>
                          <p className="text-xs text-gray-500">{date}</p>
                        </div>
                        <span
                          className={`font-mono text-sm font-semibold ${positive ? "text-emerald-700" : "text-red-700"
                            }`}
                        >
                          {positive ? "+" : ""}
                          {entry.delta}
                        </span>
                      </li>
                    )
                  })}
                </ul>
              )}
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}

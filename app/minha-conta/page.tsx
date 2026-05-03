import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { redirect } from "next/navigation"
import { Sparkles, BookOpen, LogOut } from "lucide-react"
import { SiteHeader } from "@/components/site-header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { createSSRServerClient, getCurrentUser } from "@/lib/supabase/ssr-server"
import { getActivityImageUrl, isPersonalizedImage } from "@/lib/image-utils"
import { generateMaterialSlug } from "@/lib/slug"
import { signOutAction } from "./actions"

export const metadata: Metadata = {
  title: "Minha conta | educando.app",
  robots: { index: false, follow: false },
}

export const dynamic = "force-dynamic"

interface PageProps {
  searchParams: Promise<{ compra?: string }>
}

export default async function MinhaContaPage({ searchParams }: PageProps) {
  const params = await searchParams
  const showSuccess = params.compra === "sucesso"

  const user = await getCurrentUser()
  if (!user) redirect("/login?next=/minha-conta")

  const supabase = await createSSRServerClient()
  const [{ data: balanceData }, { data: ledger }, { data: userActivities }] = await Promise.all([
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
  ])

  const balance = (balanceData as number | null) ?? 0
  const fullName =
    (user.user_metadata?.full_name as string | undefined) ?? user.email ?? "Você"

  // Generate signed URLs for private personalized images (1-hour expiry).
  const signedUrlMap = new Map<string, string>()
  if (userActivities && userActivities.length > 0) {
    const privatePaths = userActivities
      .map((a) => a.image_path)
      .filter((p): p is string => typeof p === "string" && isPersonalizedImage(p))
    if (privatePaths.length > 0) {
      const { data: signed } = await supabase.storage
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
            {showSuccess && (
              <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                <p className="font-heading font-semibold text-emerald-900">
                  Compra confirmada — créditos liberados!
                </p>
                <p className="mt-1 text-sm text-emerald-800">
                  Você já pode gerar atividades agora mesmo.
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

            {/* Saldo */}
            <div className="rounded-2xl border-2 border-amber-200 bg-white p-6 shadow-sm">
              <p className="text-sm uppercase tracking-wide text-amber-700">Saldo de créditos</p>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="font-heading text-5xl font-bold text-gray-900">{balance}</span>
                <span className="text-gray-500">crédito{balance === 1 ? "" : "s"}</span>
              </div>

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
                  <Link href="/creditos">
                    Comprar créditos
                  </Link>
                </Button>
              </div>
            </div>

            {/* Atividades geradas */}
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

            {/* Histórico de movimentações */}
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
                          className={`font-mono text-sm font-semibold ${
                            positive ? "text-emerald-700" : "text-red-700"
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

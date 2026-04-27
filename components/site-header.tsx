import Image from "next/image"
import Link from "next/link"
import { Sparkles } from "lucide-react"
import { getCurrentUser } from "@/lib/supabase/ssr-server"
import { createSSRServerClient } from "@/lib/supabase/ssr-server"

async function HeaderCta() {
  const user = await getCurrentUser()

  if (!user) {
    return (
      <Link
        href="/sejamembro"
        className="flex items-center gap-1.5 rounded-full bg-amber-500 px-4 py-1.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-amber-600"
      >
        Torna-se membro 🍎
      </Link>
    )
  }

  const supabase = await createSSRServerClient()
  const { data: balance } = await supabase.rpc("current_credit_balance", {
    p_user_id: user.id,
  })
  const saldo = (balance as number | null) ?? 0

  if (saldo > 0) {
    return (
      <div className="flex items-center gap-3">
        <span className="hidden text-xs text-gray-500 sm:block">
          {saldo} crédito{saldo === 1 ? "" : "s"}
        </span>
        <Link
          href="/criar"
          className="flex items-center gap-1.5 rounded-full bg-amber-500 px-4 py-1.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-amber-600"
        >
          <Sparkles className="h-3.5 w-3.5" />
          Criar atividade
        </Link>
      </div>
    )
  }

  return (
    <Link
      href="/sejamembro"
      className="flex items-center gap-1.5 rounded-full border border-amber-300 bg-white px-4 py-1.5 text-sm font-semibold text-amber-700 shadow-sm transition-colors hover:bg-amber-50"
    >
      Comprar créditos 🍎
    </Link>
  )
}

export function SiteHeader({ hideCta = false }: { hideCta?: boolean }) {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-amber-100/70 bg-white/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2" aria-label="educando.app — início">
          <Image
            src="/images/educando-app-logo.png"
            alt="educando.app"
            width={36}
            height={36}
            priority
            className="h-9 w-9 rounded-lg object-contain"
          />
          <span className="font-heading text-lg font-semibold tracking-tight text-gray-900">
            educando<span className="text-amber-600">.app</span>
          </span>
        </Link>

        {!hideCta && <HeaderCta />}
      </div>
    </header>
  )
}

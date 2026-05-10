import Image from "next/image"
import Link from "next/link"
import { Sparkles, User } from "lucide-react"
import { getCurrentUser } from "@/lib/supabase/ssr-server"
import { EntrarButton } from "@/components/auth/entrar-button"

function getDisplayName(fullName: string | undefined | null): string {
  const name = (fullName ?? "").trim()
  if (!name) return "Conta"
  const parts = name.split(/\s+/)
  if (parts.length === 1) return parts[0]
  return `${parts[0]} ${parts[parts.length - 1]}`
}

async function HeaderCta() {
  const user = await getCurrentUser()

  if (!user) {
    return (
      <div className="flex items-center gap-2 sm:gap-3">
        <EntrarButton />
        <Link
          href="/sejamembro"
          className="flex items-center gap-1.5 rounded-full bg-amber-500 px-6 py-1.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-amber-600 sm:px-4 w-min sm:w-full"
        >
          <Sparkles className="h-7 w-7 sm:h-3.5 sm:w-3.5" />
          Criar atividade personalizada
        </Link>
      </div>
    )
  }

  const displayName = getDisplayName(
    (user.user_metadata?.full_name as string | undefined) ?? "",
  )

  return (
    <div className="flex items-center gap-2 sm:gap-3">
      <Link
        href="/minha-conta"
        className="flex items-center gap-1.5 text-sm font-medium text-gray-700 transition-colors hover:text-amber-700"
      >
        <User className="h-4 w-4" />
        {displayName}
      </Link>
      <Link
        href="/criar"
        className="flex items-center gap-1.5 rounded-full bg-amber-500 px-3 py-1.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-amber-600 sm:px-4"
      >
        <Sparkles className="h-3.5 w-3.5" />
        Criar atividade personalizada
      </Link>
    </div>
  )
}

export function SiteHeader({ hideCta = false }: { hideCta?: boolean }) {
  return (
    <header className="z-40 w-full border-b border-amber-100/70 bg-white/80 backdrop-blur-md">
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
          <span className="font-heading text-lg font-semibold tracking-tight text-gray-900 hidden lg:inline-block">
            educando<span className="text-amber-600">.app</span>
          </span>
        </Link>

        {!hideCta && <HeaderCta />}
      </div>
    </header>
  )
}

import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/supabase/ssr-server"
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button"

export const metadata: Metadata = {
  title: "Entrar | educando.app",
  description: "Acesse sua conta no educando.app para gerenciar créditos e gerar atividades pedagógicas.",
  robots: { index: false, follow: false },
}

interface PageProps {
  searchParams: Promise<{ next?: string; error?: string }>
}

const ERROR_MESSAGES: Record<string, string> = {
  missing_code: "O Google não devolveu um código de autorização. Tente novamente.",
  exchange_failed: "Não foi possível concluir o login. Tente novamente em instantes.",
  auth_callback_failed: "Falha no callback de autenticação. Tente novamente.",
}

function safeNext(value: string | undefined) {
  if (!value) return undefined
  if (!value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) return undefined
  return value
}

export default async function LoginPage({ searchParams }: PageProps) {
  const params = await searchParams
  const next = safeNext(params.next)
  const errorCode = params.error
  const errorMessage = errorCode ? ERROR_MESSAGES[errorCode] ?? "Algo deu errado. Tente novamente." : null

  const user = await getCurrentUser()
  if (user) {
    redirect(next ?? "/minha-conta")
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-amber-50 to-white px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <Link href="/" aria-label="educando.app — início">
            <Image
              src="/images/educando-app-logo.png"
              alt="educando.app"
              width={56}
              height={56}
              priority
              className="h-14 w-14 rounded-xl object-contain"
            />
          </Link>
          <h1 className="mt-4 font-heading text-2xl font-bold tracking-tight text-gray-900">
            Entrar no educando.app
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Acesse sua conta pra comprar créditos e gerar atividades sob demanda.
          </p>
        </div>

        <div className="rounded-2xl border border-amber-200/70 bg-white p-6 shadow-sm">
          <GoogleSignInButton next={next} />

          {errorMessage && (
            <p className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {errorMessage}
            </p>
          )}

          <p className="mt-6 text-center text-xs leading-relaxed text-gray-500">
            Ao continuar, você concorda com os{" "}
            <Link href="/termos" className="text-amber-700 underline">
              Termos de Uso
            </Link>{" "}
            e a{" "}
            <Link href="/privacidade" className="text-amber-700 underline">
              Política de Privacidade
            </Link>
            .
          </p>
        </div>

        <p className="mt-6 text-center text-sm text-gray-500">
          <Link href="/" className="text-amber-700 underline">
            Voltar ao diretório
          </Link>
        </p>
      </div>
    </main>
  )
}

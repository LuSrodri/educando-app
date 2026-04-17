import Link from "next/link"
import { ShieldAlert } from "lucide-react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Acesso bloqueado | educando.app",
  description: "Acesso temporariamente bloqueado por proteção de segurança.",
  robots: { index: false, follow: false },
}

export default function UnauthorizedPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-amber-50 to-white px-4 py-16 text-center">
      <div className="mx-auto max-w-md rounded-3xl border border-amber-200 bg-white p-8 shadow-xl">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-600">
          <ShieldAlert className="h-7 w-7" aria-hidden />
        </div>
        <h1 className="mt-5 font-heading text-2xl font-bold text-gray-900">
          Acesso temporariamente bloqueado
        </h1>
        <p className="mt-3 text-sm text-gray-600">
          Identificamos um padrão de acesso incomum a partir do seu navegador. Por segurança, o
          diretório está pausado para esta sessão.
        </p>
        <p className="mt-2 text-sm text-gray-600">
          Se você é um professor e acredita que isso é um engano, tente novamente em alguns minutos
          ou entre em contato pelo e-mail{" "}
          <a
            href="mailto:rodrigueslucass@outlook.com.br"
            className="font-medium text-amber-700 underline underline-offset-2"
          >
            rodrigueslucass@outlook.com.br
          </a>
          .
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-amber-500 px-5 py-2 text-sm font-semibold text-white shadow hover:bg-amber-600"
        >
          Voltar ao diretório
        </Link>
      </div>
    </main>
  )
}

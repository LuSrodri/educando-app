"use client"

import Link from "next/link"
import { ArrowRight, Sparkles } from "lucide-react"

interface Props {
  /** Quantos resultados a busca atual retornou. */
  total: number
  /** A query submetida (vazia = só navegando o diretório). */
  submittedQuery: string
}

/**
 * CTA contextual ao fim da lista de resultados — captura intenção logo após
 * a busca, momento de conversão mais alto da página.
 *
 * Três variantes visuais por estado:
 * - Zero resultados + query → spotlight (full card, mais agressivo)
 * - Resultados existem + query → card médio (convite alternativa)
 * - Sem query (browsing) → tira sutil
 *
 * O link aponta sempre para /sejamembro?tema=X — a página redireciona
 * usuários autenticados com saldo direto pra /criar (com a query carregada).
 */
export function CreateCta({ total, submittedQuery }: Props) {
  const hasQuery = submittedQuery.trim().length > 0
  const href = hasQuery
    ? `/sejamembro?tema=${encodeURIComponent(submittedQuery)}`
    : "/sejamembro"

  // Variante 1 — zero resultados com query: spotlight
  if (hasQuery && total === 0) {
    return (
      <div className="my-12 overflow-hidden rounded-3xl border-2 border-amber-200 bg-gradient-to-br from-amber-50 via-amber-50/60 to-white p-8 sm:p-12">
        <div className="mx-auto max-w-xl text-center">
          <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500 text-white shadow-lg shadow-amber-200">
            <Sparkles className="h-7 w-7" />
          </div>
          <h3 className="font-heading text-2xl font-black tracking-tight text-gray-950 sm:text-3xl">
            Não encontramos atividades para{" "}
            <span className="text-amber-700">&ldquo;{submittedQuery}&rdquo;</span>
          </h3>
          <p className="mx-auto mt-3 max-w-md text-base text-gray-700">
            Mas você pode criar uma ficha personalizada agora, em menos de
            1 minuto — alinhada à BNCC e à cultura brasileira.
          </p>
          <Link
            href={href}
            className="mt-7 inline-flex items-center gap-2 rounded-xl bg-amber-500 px-7 py-3.5 text-base font-bold text-white shadow-lg transition-all hover:bg-amber-600 hover:shadow-xl hover:shadow-amber-200"
          >
            Criar a minha ficha agora
            <ArrowRight className="h-4 w-4" />
          </Link>
          <p className="mt-4 text-xs text-gray-500">
            5 atividades por R$ 14,90 · pagamento único via Pix
          </p>
        </div>
      </div>
    )
  }

  // Variante 2 — algum resultado mas pode não ser ideal: card médio
  if (hasQuery && total > 0) {
    return (
      <div className="my-10 rounded-2xl border border-amber-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:items-center sm:gap-6 sm:text-left">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-600">
            <Sparkles className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <h3 className="font-heading text-lg font-bold text-gray-900 sm:text-xl">
              Não foi exatamente o que você precisa?
            </h3>
            <p className="mt-1 text-sm text-gray-600">
              Crie uma ficha sob medida pro seu tema e turma — em 60 segundos, a partir de R$ 2,98 por ficha.
            </p>
          </div>
          <Link
            href={href}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-amber-500 px-5 py-3 text-sm font-bold text-white shadow-sm transition-all hover:bg-amber-600 hover:shadow-md"
          >
            Personalizar a minha
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    )
  }

  // Variante 3 — só navegando o diretório (sem query): tira sutil
  return (
    <div className="my-10 rounded-2xl border border-dashed border-amber-200 bg-amber-50/40 px-6 py-5 text-center">
      <p className="text-sm text-gray-700">
        <span className="font-semibold text-gray-900">Não achou nada que sirva?</span>{" "}
        Crie a sua atividade personalizada em menos de 1 minuto.
      </p>
      <Link
        href={href}
        className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-amber-700 underline-offset-2 hover:underline"
      >
        Criar minha atividade
        <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  )
}

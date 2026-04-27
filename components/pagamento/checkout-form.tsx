"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { formatCpf, isCpfAcceptable, sanitizeCpf } from "@/lib/cpf"

interface Props {
  packCode: string
  packLabel: string
  priceLabel: string
  defaultName?: string
}

const ERROR_MESSAGES: Record<string, string> = {
  invalid_pack: "Pacote inválido — recarregue a página.",
  invalid_name: "Informe seu nome completo (mín. 3 caracteres).",
  invalid_cpf: "CPF inválido — confira os dígitos.",
  unauthorized: "Sua sessão expirou. Faça login novamente.",
  stripe_error: "Não conseguimos gerar o Pix agora. Tente em alguns segundos.",
  db_error: "Erro interno. Tente novamente.",
}

export function CheckoutForm({ packCode, packLabel, priceLabel, defaultName }: Props) {
  const router = useRouter()
  const [fullName, setFullName] = useState(defaultName ?? "")
  const [cpf, setCpf] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const cpfDigits = sanitizeCpf(cpf)
  const cpfValid = cpfDigits.length === 11 && isCpfAcceptable(cpfDigits)
  const nameValid = fullName.trim().length >= 3
  const canSubmit = nameValid && cpfValid && !submitting

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit) return

    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch("/api/pagamento/criar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          packCode,
          fullName: fullName.trim(),
          cpf: cpfDigits,
        }),
      })
      const data = (await res.json()) as { paymentId?: string; error?: string }
      if (!res.ok || !data.paymentId) {
        const code = data.error ?? "stripe_error"
        setError(ERROR_MESSAGES[code] ?? "Algo deu errado. Tente novamente.")
        setSubmitting(false)
        return
      }
      router.push(`/pagamento/${data.paymentId}`)
    } catch {
      setError("Erro de rede. Tente novamente.")
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label htmlFor="fullName" className="mb-1 block text-sm font-medium text-gray-800">
          Nome completo
        </label>
        <Input
          id="fullName"
          type="text"
          autoComplete="name"
          required
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Como aparece no seu CPF"
          className="bg-white"
        />
      </div>

      <div>
        <label htmlFor="cpf" className="mb-1 block text-sm font-medium text-gray-800">
          CPF
        </label>
        <Input
          id="cpf"
          type="text"
          inputMode="numeric"
          autoComplete="off"
          required
          value={formatCpf(cpf)}
          onChange={(e) => setCpf(e.target.value)}
          placeholder="000.000.000-00"
          maxLength={14}
          className="bg-white font-mono"
        />
        <p className="mt-1 text-xs text-gray-500">
          Exigido pelo Banco Central para pagamentos Pix internacionais. Não é compartilhado com terceiros além do processador.
        </p>
      </div>

      {error && (
        <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700" role="alert">
          {error}
        </p>
      )}

      <Button
        type="submit"
        disabled={!canSubmit}
        size="lg"
        className="w-full bg-amber-600 text-white hover:bg-amber-700"
      >
        {submitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Gerando Pix…
          </>
        ) : (
          <>Pagar {priceLabel} via Pix</>
        )}
      </Button>

      <p className="text-center text-xs text-gray-500">
        Pacote {packLabel} · pagamento único · sem renovação automática
      </p>
    </form>
  )
}

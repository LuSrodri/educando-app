"use client"

import { useState } from "react"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { formatCpf, isCpfValid, sanitizeCpf } from "@/lib/cpf"

export interface QrData {
  qrImageUrl: string
  qrText: string
  expiresAt: string
}

interface Props {
  packCode: string
  packLabel: string
  priceLabel: string
  defaultName?: string
  onSuccess: (paymentId: string, qrData: QrData) => void
  onBack?: () => void
}

const ERROR_MESSAGES: Record<string, string> = {
  invalid_pack: "Pacote inválido — recarregue a página.",
  invalid_name: "Informe seu nome completo (mín. 3 caracteres).",
  invalid_cpf: "CPF inválido — confira os dígitos.",
  unauthorized: "Sua sessão expirou. Faça login novamente.",
  stripe_error: "Não conseguimos gerar o Pix agora. Tente em alguns segundos.",
  db_error: "Erro interno. Tente novamente.",
}

const IS_TEST_MODE = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.startsWith("pk_test_") ?? false

export function CheckoutForm({ packCode, packLabel, priceLabel, defaultName, onSuccess, onBack }: Props) {
  const [fullName, setFullName] = useState(defaultName ?? "")
  const [cpf, setCpf] = useState("")
  const [cpfTouched, setCpfTouched] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const cpfDigits = sanitizeCpf(cpf)
  const isTestCpf = IS_TEST_MODE && cpfDigits === "00000000000"
  const cpfValid = cpfDigits.length === 11 && (isTestCpf || isCpfValid(cpfDigits))
  const cpfError = cpfTouched && cpfDigits.length === 11 && !cpfValid

  const nameValid = fullName.trim().length >= 3
  const canSubmit = nameValid && cpfValid && !submitting

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setCpfTouched(true)
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
      const data = (await res.json()) as {
        paymentId?: string
        qrImageUrl?: string
        qrText?: string
        expiresAt?: string
        error?: string
      }
      if (!res.ok || !data.paymentId) {
        const code = data.error ?? "stripe_error"
        setError(ERROR_MESSAGES[code] ?? "Algo deu errado. Tente novamente.")
        setSubmitting(false)
        return
      }
      onSuccess(data.paymentId, {
        qrImageUrl: data.qrImageUrl ?? "",
        qrText: data.qrText ?? "",
        expiresAt: data.expiresAt ?? new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      })
    } catch {
      setError("Erro de rede. Tente novamente.")
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="mb-1 flex items-center gap-1 text-sm text-gray-500 hover:text-amber-700"
        >
          ← Voltar
        </button>
      )}

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
          value={formatCpf(cpf)}
          onChange={(e) => {
            setCpf(e.target.value)
            if (!cpfTouched && sanitizeCpf(e.target.value).length === 11) {
              setCpfTouched(true)
            }
          }}
          onBlur={() => cpfDigits.length > 0 && setCpfTouched(true)}
          placeholder="000.000.000-00"
          maxLength={14}
          className={`bg-white font-mono ${cpfError ? "border-red-400 focus-visible:ring-red-400" : ""}`}
        />
        {cpfError && (
          <p className="mt-1 text-xs text-red-600">CPF inválido — confira os dígitos.</p>
        )}
        {isTestCpf && (
          <p className="mt-1 text-xs text-amber-600">CPF de teste (sandbox Stripe).</p>
        )}
        {!cpfError && !isTestCpf && (
          <p className="mt-1 text-xs text-gray-500">
            Exigido pelo Banco Central para pagamentos Pix internacionais.
            {IS_TEST_MODE &&
              (
                <>
                  <br /> <br /> Use 000.000.000-00 para testes.
                </>
              )
            }
          </p>
        )}
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

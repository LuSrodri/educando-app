"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Check, Copy, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"

interface Props {
  paymentId: string
  qrSvgDataUrl: string
  pixCopyPaste: string
  expiresAt: string
  successPath: string
}

type Status = "pending" | "paid" | "failed" | "canceled" | "expired"

function formatRemaining(ms: number) {
  if (ms <= 0) return "00:00"
  const total = Math.floor(ms / 1000)
  const m = Math.floor(total / 60).toString().padStart(2, "0")
  const s = (total % 60).toString().padStart(2, "0")
  return `${m}:${s}`
}

export function PixQrDisplay({
  paymentId,
  qrSvgDataUrl,
  pixCopyPaste,
  expiresAt,
  successPath,
}: Props) {
  const router = useRouter()
  const [status, setStatus] = useState<Status>("pending")
  const [copied, setCopied] = useState(false)
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    if (status !== "pending") return
    let cancelled = false

    async function poll() {
      try {
        const res = await fetch(`/api/pagamento/${paymentId}/status`, {
          cache: "no-store",
        })
        if (!res.ok) return
        const data = (await res.json()) as { status: Status }
        if (cancelled) return
        setStatus(data.status)
        if (data.status === "paid") {
          // Pequena pausa pra exibir o estado de sucesso antes de redirecionar.
          setTimeout(() => router.push(successPath), 1200)
        }
      } catch {
        // Silencioso — próximo tick tenta de novo.
      }
    }

    const interval = setInterval(poll, 4000)
    poll()
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [paymentId, status, router, successPath])

  const expiresMs = new Date(expiresAt).getTime() - now
  const expired = expiresMs <= 0
  const remaining = formatRemaining(expiresMs)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(pixCopyPaste)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      // ignore
    }
  }

  if (status === "paid") {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-emerald-200 bg-emerald-50 p-8 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 text-white">
          <Check className="h-7 w-7" />
        </div>
        <p className="font-heading text-xl font-bold text-emerald-900">
          Pagamento confirmado!
        </p>
        <p className="text-sm text-emerald-800">Redirecionando…</p>
      </div>
    )
  }

  if (status === "failed" || status === "canceled" || status === "expired" || expired) {
    return (
      <div className="rounded-2xl border-2 border-red-200 bg-red-50 p-6 text-center">
        <p className="font-heading text-lg font-bold text-red-900">Pagamento expirou</p>
        <p className="mt-2 text-sm text-red-800">
          O Pix não foi confirmado dentro de 30 minutos. Você pode tentar novamente.
        </p>
        <Button
          className="mt-4"
          variant="outline"
          onClick={() => router.push("/sejamembro")}
        >
          Escolher outro pacote
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center gap-3 rounded-2xl border-2 border-amber-200 bg-white p-6">
        <img
          src={qrSvgDataUrl}
          alt="QR Code Pix"
          className="h-64 w-64 rounded-lg border border-gray-200 bg-white p-3"
        />
        <p className="text-center text-sm text-gray-600">
          Abra o app do seu banco, escolha pagar com Pix por QR Code e aponte a câmera.
        </p>
      </div>

      <div>
        <p className="mb-2 text-sm font-medium text-gray-700">Ou copie e cole este código:</p>
        <div className="flex gap-2">
          <code className="flex-1 truncate rounded-md border border-gray-200 bg-gray-50 px-3 py-2 font-mono text-xs text-gray-800">
            {pixCopyPaste}
          </code>
          <Button
            type="button"
            variant="outline"
            onClick={handleCopy}
            className="shrink-0"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4" />
                Copiado
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                Copiar
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-center gap-2 text-sm text-gray-700">
        <Loader2 className="h-4 w-4 animate-spin text-amber-600" />
        <span>
          Aguardando confirmação do pagamento — código expira em{" "}
          <strong className="font-mono">{remaining}</strong>
        </span>
      </div>
    </div>
  )
}

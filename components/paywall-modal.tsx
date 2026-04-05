"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { track } from "@vercel/analytics"
import * as Dialog from "@radix-ui/react-dialog"
import {
  Lock,
  Copy,
  Check,
  X,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  Zap,
  Shield,
} from "lucide-react"

interface PaywallModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  browserId: string
}

type ModalState = "select_pack" | "loading" | "pix_qr" | "expired" | "success" | "error"
type PackId = "10" | "20"

interface PixData {
  externalRef: string
  qrCode: string
  qrCodeBase64: string
  expiresAt: string
  credits: number
  pack: PackId
}

const PACKS = {
  "10": {
    price: "R$\u00a014,90",
    credits: 10,
    label: "10 atividades",
    badge: "Mais popular",
    badgeColor: "bg-amber-500 text-white",
    perCredit: "R$\u00a01,49 por atividade",
  },
  "20": {
    price: "R$\u00a024,90",
    credits: 20,
    label: "20 atividades",
    badge: "Melhor valor",
    badgeColor: "bg-emerald-500 text-white",
    perCredit: "R$\u00a01,25 por atividade",
  },
} as const

function formatCountdown(seconds: number): string {
  const m = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0")
  const s = (seconds % 60).toString().padStart(2, "0")
  return `${m}:${s}`
}

export function PaywallModal({ isOpen, onClose, onSuccess, browserId }: PaywallModalProps) {
  const [state, setState] = useState<ModalState>("select_pack")
  const [selectedPack, setSelectedPack] = useState<PackId>("10")
  const [pixData, setPixData] = useState<PixData | null>(null)
  const [countdown, setCountdown] = useState(0)
  const [copied, setCopied] = useState(false)
  const [errorMsg, setErrorMsg] = useState("")
  const [grantedCredits, setGrantedCredits] = useState(0)

  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current)
      pollingRef.current = null
    }
  }, [])

  const stopCountdown = useCallback(() => {
    if (countdownRef.current) {
      clearInterval(countdownRef.current)
      countdownRef.current = null
    }
  }, [])

  // Cleanup on unmount or close
  useEffect(() => {
    if (!isOpen) {
      stopPolling()
      stopCountdown()
    }
    return () => {
      stopPolling()
      stopCountdown()
    }
  }, [isOpen, stopPolling, stopCountdown])

  // Reset when opened — but preserve an active PIX session
  useEffect(() => {
    if (!isOpen) return

    if (state === "pix_qr" && pixData) {
      // Modal was closed while PIX was active — check if still valid and resume
      const remaining = Math.max(0, Math.floor((new Date(pixData.expiresAt).getTime() - Date.now()) / 1000))
      if (remaining > 0) {
        startCountdown(pixData.expiresAt)
        startPolling(pixData.externalRef)
      } else {
        setState("expired")
      }
      return
    }

    if (state !== "success") {
      setState("select_pack")
      setPixData(null)
      setErrorMsg("")
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen])

  const startCountdown = useCallback(
    (expiresAt: string) => {
      stopCountdown()
      const updateCountdown = () => {
        const remaining = Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000))
        setCountdown(remaining)
        if (remaining === 0) {
          stopPolling()
          stopCountdown()
          setState("expired")
        }
      }
      updateCountdown()
      countdownRef.current = setInterval(updateCountdown, 1000)
    },
    [stopPolling, stopCountdown]
  )

  const startPolling = useCallback(
    (externalRef: string) => {
      stopPolling()
      pollingRef.current = setInterval(async () => {
        try {
          const res = await fetch(`/api/payments/status/${encodeURIComponent(externalRef)}`)
          if (!res.ok) return
          const data = await res.json()
          if (data.status === "approved") {
            stopPolling()
            stopCountdown()
            setGrantedCredits(data.balance ?? pixData?.credits ?? 0)
            setState("success")
            onSuccess()
          }
        } catch {
          // silent — keep polling
        }
      }, 3000)
    },
    [stopPolling, stopCountdown, pixData, onSuccess]
  )

  const handleBuyPack = async (pack: PackId) => {
    setSelectedPack(pack)
    setState("loading")
    track("checkout_initiated", { pack, credits: PACKS[pack].credits, price: PACKS[pack].price })
    try {
      const res = await fetch("/api/payments/create-pix", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ browserId, pack }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Erro ao criar pagamento")
      }
      const data = await res.json()
      const pix: PixData = {
        externalRef: data.externalRef,
        qrCode: data.qrCode,
        qrCodeBase64: data.qrCodeBase64,
        expiresAt: data.expiresAt,
        credits: data.credits,
        pack,
      }
      setPixData(pix)
      setState("pix_qr")
      startCountdown(pix.expiresAt)
      startPolling(pix.externalRef)
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Erro desconhecido")
      setState("error")
    }
  }

  const handleCopy = async () => {
    if (!pixData?.qrCode) return
    try {
      await navigator.clipboard.writeText(pixData.qrCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // fallback: select text
    }
  }

  const handleClose = () => {
    stopPolling()
    stopCountdown()
    onClose()
  }

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content
          className="fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 w-full max-w-md outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
          aria-describedby={undefined}
        >
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[calc(100dvh-2rem)] overflow-y-auto mx-4">
            {/* Decorative top stripe */}
            <div className="h-1 w-full bg-gradient-to-r from-amber-400 via-amber-500 to-amber-400" />

            {/* Close button */}
            <Dialog.Close asChild>
              <button
                className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer z-10"
                aria-label="Fechar"
              >
                <X className="w-4 h-4" />
              </button>
            </Dialog.Close>

            {state === "select_pack" && (
              <SelectPackView
                selectedPack={selectedPack}
                onSelect={setSelectedPack}
                onBuy={handleBuyPack}
              />
            )}

            {state === "loading" && <LoadingView />}

            {state === "pix_qr" && pixData && (
              <PixQrView
                pixData={pixData}
                countdown={countdown}
                copied={copied}
                onCopy={handleCopy}
              />
            )}

            {state === "expired" && pixData && (
              <ExpiredView onRetry={() => handleBuyPack(pixData.pack)} />
            )}

            {state === "success" && (
              <SuccessView credits={grantedCredits} onContinue={handleClose} />
            )}

            {state === "error" && (
              <ErrorView message={errorMsg} onRetry={() => setState("select_pack")} />
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

/* ── Sub-views ─────────────────────────────────────────────────── */

function SelectPackView({
  selectedPack,
  onSelect,
  onBuy,
}: {
  selectedPack: PackId
  onSelect: (p: PackId) => void
  onBuy: (p: PackId) => void
}) {
  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-start gap-3 pr-8">
        <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center shrink-0 mt-0.5">
          <Lock className="w-5 h-5 text-amber-600" />
        </div>
        <div>
          <Dialog.Title className="text-lg font-bold text-gray-900 font-heading leading-tight">
            Continue criando sem limites
          </Dialog.Title>
          <p className="text-sm text-gray-500 mt-0.5">
            Sem assinatura — pague só o que usar. Créditos não expiram.
          </p>
        </div>
      </div>

      {/* Pack cards */}
      <div className="grid grid-cols-2 gap-3">
        {(["10", "20"] as PackId[]).map((packId) => {
          const pack = PACKS[packId]
          const isSelected = selectedPack === packId
          return (
            <button
              key={packId}
              type="button"
              onClick={() => onSelect(packId)}
              className={`relative flex flex-col text-left rounded-xl border-2 p-4 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${
                isSelected
                  ? "border-amber-500 bg-amber-50 shadow-md shadow-amber-100"
                  : "border-gray-200 bg-white hover:border-amber-300 hover:bg-amber-50/40"
              }`}
              aria-pressed={isSelected}
            >
              {/* Badge */}
              <span className={`self-start text-[10px] font-bold px-2 py-0.5 rounded-full mb-3 ${pack.badgeColor}`}>
                {pack.badge}
              </span>

              {/* Price */}
              <span className="text-2xl font-extrabold text-gray-900 font-heading leading-none">
                {pack.price}
              </span>
              <span className="text-sm font-semibold text-gray-700 mt-1">{pack.label}</span>
              <span className="text-xs text-gray-400 mt-0.5">{pack.perCredit}</span>

              {/* Selected indicator */}
              {isSelected && (
                <span className="absolute top-3 right-3 w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center">
                  <Check className="w-3 h-3 text-white" strokeWidth={3} />
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* CTA */}
      <button
        type="button"
        onClick={() => onBuy(selectedPack)}
        className="w-full bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white font-bold py-3.5 rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-2 text-sm shadow-lg shadow-amber-200"
      >
        <Zap className="w-4 h-4" />
        Pagar com PIX — {PACKS[selectedPack].price}
      </button>

      {/* Trust signals */}
      <div className="flex items-center justify-center gap-1.5 text-xs text-gray-400">
        <Shield className="w-3.5 h-3.5" />
        <span>Pagamento seguro via Mercado Pago</span>
      </div>

      <p className="text-center text-[11px] text-gray-400 leading-relaxed">
        Pagamento instantâneo via PIX. Atividades pagas são privadas — não aparecem na galeria.
      </p>
    </div>
  )
}

function LoadingView() {
  return (
    <div className="p-10 flex flex-col items-center justify-center gap-4 min-h-[220px]">
      <div className="w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-amber-500 animate-spin" />
      </div>
      <p className="text-sm font-medium text-gray-600">Gerando QR Code PIX...</p>
    </div>
  )
}

function PixQrView({
  pixData,
  countdown,
  copied,
  onCopy,
}: {
  pixData: PixData
  countdown: number
  copied: boolean
  onCopy: () => void
}) {
  const isUrgent = countdown > 0 && countdown <= 120

  return (
    <div className="p-6 space-y-4">
      {/* Header */}
      <div className="pr-8">
        <Dialog.Title className="text-lg font-bold text-gray-900 font-heading">
          Pague com PIX
        </Dialog.Title>
        <p className="text-sm text-gray-500 mt-0.5">
          {PACKS[pixData.pack].label} — {PACKS[pixData.pack].price}
        </p>
      </div>

      {/* QR Code */}
      {pixData.qrCodeBase64 ? (
        <div className="flex justify-center">
          <div className="w-44 h-44 bg-white border-2 border-gray-100 rounded-xl overflow-hidden p-2 shadow-inner">
            <img
              src={`data:image/png;base64,${pixData.qrCodeBase64}`}
              alt="QR Code PIX"
              className="w-full h-full object-contain"
            />
          </div>
        </div>
      ) : (
        <div className="flex justify-center">
          <div className="w-44 h-44 bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl flex items-center justify-center">
            <span className="text-xs text-gray-400 text-center px-4">QR Code não disponível</span>
          </div>
        </div>
      )}

      {/* Copia e cola */}
      {pixData.qrCode && (
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-gray-500">Código PIX copia e cola:</p>
          <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg p-2">
            <code className="flex-1 text-[10px] text-gray-700 font-mono break-all leading-tight line-clamp-2 select-all">
              {pixData.qrCode}
            </code>
            <button
              type="button"
              onClick={onCopy}
              className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg bg-white border border-gray-200 hover:bg-amber-50 hover:border-amber-300 transition-colors cursor-pointer"
              aria-label="Copiar código PIX"
            >
              {copied ? (
                <Check className="w-3.5 h-3.5 text-emerald-500" strokeWidth={3} />
              ) : (
                <Copy className="w-3.5 h-3.5 text-gray-500" />
              )}
            </button>
          </div>
          {copied && (
            <p className="text-xs text-emerald-600 font-medium">Código copiado!</p>
          )}
        </div>
      )}

      {/* Status row */}
      <div className="flex items-center justify-between">
        {/* Awaiting */}
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500" />
          </span>
          <span className="text-sm text-gray-600">Aguardando pagamento...</span>
        </div>

        {/* Countdown */}
        <div className={`flex items-center gap-1.5 text-xs font-bold ${isUrgent ? "text-red-500" : "text-amber-600"}`}>
          <Clock className="w-3.5 h-3.5" />
          <span>Expira em {formatCountdown(countdown)}</span>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 space-y-1">
        <p className="text-xs text-amber-800 leading-relaxed">
          Seus créditos serão adicionados automaticamente após a confirmação do pagamento.
        </p>
        <p className="text-[11px] text-amber-600">
          O PIX pode levar alguns minutos para ser confirmado.
        </p>
      </div>
    </div>
  )
}

function ExpiredView({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="p-8 flex flex-col items-center text-center gap-5">
      <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center">
        <Clock className="w-7 h-7 text-gray-400" />
      </div>
      <div>
        <Dialog.Title className="text-lg font-bold text-gray-900 font-heading">
          QR Code expirado
        </Dialog.Title>
        <p className="text-sm text-gray-500 mt-1">
          O prazo para pagamento expirou. Gere um novo código PIX para continuar.
        </p>
      </div>
      <button
        type="button"
        onClick={onRetry}
        className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 rounded-xl transition-colors cursor-pointer text-sm"
      >
        Gerar novo QR Code
      </button>
    </div>
  )
}

function SuccessView({ credits, onContinue }: { credits: number; onContinue: () => void }) {
  return (
    <div className="p-8 flex flex-col items-center text-center gap-5">
      <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center">
        <CheckCircle2 className="w-9 h-9 text-emerald-500" />
      </div>
      <div>
        <Dialog.Title className="text-xl font-bold text-gray-900 font-heading">
          Pagamento confirmado!
        </Dialog.Title>
        <p className="text-sm text-gray-600 mt-1.5">
          {credits > 0
            ? `Você agora tem ${credits} créditos disponíveis.`
            : "Seus créditos foram adicionados à sua conta."}
        </p>
      </div>
      <button
        type="button"
        onClick={onContinue}
        className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-3.5 rounded-xl transition-colors cursor-pointer text-sm shadow-lg shadow-amber-200"
      >
        Continuar gerando
      </button>
    </div>
  )
}

function ErrorView({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="p-8 flex flex-col items-center text-center gap-5">
      <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center">
        <XCircle className="w-8 h-8 text-red-400" />
      </div>
      <div>
        <Dialog.Title className="text-lg font-bold text-gray-900 font-heading">
          Erro ao processar pagamento
        </Dialog.Title>
        {message && (
          <p className="text-sm text-red-600 mt-1.5 bg-red-50 rounded-lg px-3 py-2">{message}</p>
        )}
      </div>
      <button
        type="button"
        onClick={onRetry}
        className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 rounded-xl transition-colors cursor-pointer text-sm"
      >
        Tentar novamente
      </button>
    </div>
  )
}

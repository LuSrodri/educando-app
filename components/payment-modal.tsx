"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { X, Shield, Zap, Loader2, Copy, Check, QrCode } from "lucide-react"
import { getSessionId, PRICE_PER_ACTIVITY, addPaidActivity } from "@/lib/session"

interface PaymentModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

interface PixPaymentData {
  paymentId: string
  qrCode: string
  qrCodeBase64: string
  expirationDate: string
}

export function PaymentModal({ isOpen, onClose, onSuccess }: PaymentModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [pixData, setPixData] = useState<PixPaymentData | null>(null)
  const [copied, setCopied] = useState(false)
  const [email, setEmail] = useState("")
  const [emailError, setEmailError] = useState("")
  const [timeRemaining, setTimeRemaining] = useState<string>("")
  const [paymentStatus, setPaymentStatus] = useState<"pending" | "checking" | "approved" | "failed">("pending")
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    // Limpar polling quando fechar o modal
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
      }
    }
  }, [])

  useEffect(() => {
    // Iniciar polling quando tiver dados do PIX
    if (pixData && paymentStatus === "checking") {
      pollingIntervalRef.current = setInterval(() => {
        checkPaymentStatus(pixData.paymentId)
      }, 2500) // 2.5 segundos

      return () => {
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current)
        }
      }
    }
  }, [pixData, paymentStatus])

  useEffect(() => {
    // Atualizar contador de tempo restante
    if (pixData && paymentStatus === "checking") {
      const updateTimer = () => {
        const now = new Date().getTime()
        const expiration = new Date(pixData.expirationDate).getTime()
        const remaining = expiration - now

        if (remaining <= 0) {
          setTimeRemaining("Expirado")
          setPaymentStatus("failed")
          if (timerIntervalRef.current) {
            clearInterval(timerIntervalRef.current)
          }
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current)
          }
        } else {
          const minutes = Math.floor(remaining / 60000)
          const seconds = Math.floor((remaining % 60000) / 1000)
          setTimeRemaining(`${minutes}:${seconds.toString().padStart(2, "0")}`)
        }
      }

      updateTimer() // Atualizar imediatamente
      timerIntervalRef.current = setInterval(updateTimer, 1000)

      return () => {
        if (timerIntervalRef.current) {
          clearInterval(timerIntervalRef.current)
        }
      }
    }
  }, [pixData, paymentStatus])

  if (!isOpen) return null

  const checkPaymentStatus = async (paymentId: string) => {
    try {
      const response = await fetch(`/api/check-payment?paymentId=${paymentId}`)
      const data = await response.json()

      if (data.status === "approved") {
        setPaymentStatus("approved")
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current)
        }
        // Adicionar atividade paga
        addPaidActivity()
        // Aguardar 1.5s para mostrar sucesso antes de fechar
        setTimeout(() => {
          onSuccess?.()
          onClose()
        }, 1500)
      } else if (data.status === "rejected" || data.status === "cancelled") {
        setPaymentStatus("failed")
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current)
        }
      }
    } catch (error) {
      console.error("Erro ao verificar pagamento:", error)
    }
  }

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const handleCreatePayment = async () => {
    // Validar email
    if (!email.trim()) {
      setEmailError("Digite seu email")
      return
    }

    if (!validateEmail(email)) {
      setEmailError("Digite um email válido")
      return
    }

    setEmailError("")
    setIsLoading(true)

    try {
      const sessionId = getSessionId()

      const response = await fetch("/api/create-pix-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, amount: PRICE_PER_ACTIVITY, email: email.trim() }),
      })

      const data = await response.json()

      if (data.error) {
        setEmailError(data.error)
        setIsLoading(false)
        return
      }

      setPixData({
        paymentId: data.paymentId,
        qrCode: data.qrCode,
        qrCodeBase64: data.qrCodeBase64,
        expirationDate: data.expirationDate,
      })
      setPaymentStatus("checking")
      setIsLoading(false)
    } catch (error) {
      console.error("Erro ao criar pagamento:", error)
      setEmailError("Erro ao processar pagamento")
      setIsLoading(false)
    }
  }

  const handleCopyPix = async () => {
    if (pixData) {
      await navigator.clipboard.writeText(pixData.qrCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleBack = () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current)
    }
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current)
    }
    setPixData(null)
    setPaymentStatus("pending")
    setCopied(false)
    setEmailError("")
    setTimeRemaining("")
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full shadow-2xl border-2 border-amber-400 bg-white animate-in fade-in zoom-in duration-200">
        <CardContent className="p-6">
          {/* Pagamento aprovado */}
          {paymentStatus === "approved" && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Pagamento Aprovado!</h2>
              <p className="text-gray-600">Você ganhou mais 1 atividade</p>
            </div>
          )}

          {/* Pagamento falhou */}
          {paymentStatus === "failed" && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <X className="w-8 h-8 text-red-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {timeRemaining === "Expirado" ? "QR Code Expirado" : "Pagamento não Aprovado"}
              </h2>
              <p className="text-gray-600 mb-4">
                {timeRemaining === "Expirado" 
                  ? "O prazo de 30 minutos expirou. Gere um novo QR Code."
                  : "Tente novamente"}
              </p>
              <Button onClick={handleBack} className="bg-amber-600 hover:bg-amber-700">
                {timeRemaining === "Expirado" ? "Gerar Novo QR Code" : "Voltar"}
              </Button>
            </div>
          )}

          {/* Mostrando QR Code PIX */}
          {pixData && paymentStatus === "checking" && (
            <>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Pague com PIX</h2>
                  <p className="text-gray-600 text-sm mt-1">Escaneie o QR Code ou copie o código</p>
                </div>
                <button
                  onClick={handleBack}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label="Voltar"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* QR Code */}
              <div className="bg-white border-2 border-gray-200 rounded-xl p-4 mb-4">
                <div className="flex justify-center">
                  <img
                    src={`data:image/png;base64,${pixData.qrCodeBase64}`}
                    alt="QR Code PIX"
                    className="w-64 h-64"
                  />
                </div>
              </div>

              {/* Código PIX para copiar */}
              <div className="mb-4">
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Ou copie o código PIX:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={pixData.qrCode}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50 font-mono"
                  />
                  <Button
                    onClick={handleCopyPix}
                    variant="outline"
                    className="px-4"
                  >
                    {copied ? (
                      <Check className="w-4 h-4 text-green-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Status de aguardando pagamento */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <div className="flex items-center gap-3">
                  <Loader2 className="w-5 h-5 text-blue-600 animate-spin flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-blue-900">Aguardando pagamento...</p>
                    <p className="text-xs text-blue-700 mt-0.5">
                      Verificando automaticamente a cada 2.5 segundos
                    </p>
                  </div>
                  {timeRemaining && timeRemaining !== "Expirado" && (
                    <div className="text-right">
                      <p className="text-xs text-blue-700">Expira em:</p>
                      <p className="text-lg font-bold text-blue-900">{timeRemaining}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Informações */}
              <div className="space-y-2 text-xs text-gray-600">
                <p>• QR Code válido por 30 minutos</p>
                <p>• Confirmação instantânea após o pagamento</p>
                <p>• Você ganhará +1 atividade após a confirmação</p>
              </div>
            </>
          )}

          {/* Tela inicial - Oferta */}
          {!pixData && paymentStatus === "pending" && (
            <>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Limite Diário Atingido</h2>
                  <p className="text-gray-600 text-sm mt-1">Você usou suas 3 atividades gratuitas de hoje</p>
                </div>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label="Fechar"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Oferta */}
              <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-5 mb-5 border border-amber-200">
                <div className="text-center">
                  <p className="text-sm text-amber-800 font-medium mb-1">Continue criando atividades por apenas</p>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-sm text-gray-600">R$</span>
                    <span className="text-4xl font-bold text-amber-700">
                      {PRICE_PER_ACTIVITY.toFixed(2).replace(".", ",")}
                    </span>
                    <span className="text-sm text-gray-600">/ atividade</span>
                  </div>
                </div>
              </div>

              {/* Benefícios */}
              <div className="space-y-3 mb-5">
                <div className="flex items-center gap-3 text-sm text-gray-700">
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                    <Zap className="w-4 h-4 text-green-600" />
                  </div>
                  <span>Atividade gerada instantaneamente</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-700">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <QrCode className="w-4 h-4 text-blue-600" />
                  </div>
                  <span>Pagamento rápido e seguro via PIX</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-700">
                  <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                    <Shield className="w-4 h-4 text-purple-600" />
                  </div>
                  <span>Edições ilimitadas após geração</span>
                </div>
              </div>

              {/* Campo de Email */}
              <div className="mb-5">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Seu email para receber o comprovante
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    setEmailError("")
                  }}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                    emailError
                      ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                      : "border-gray-300 focus:ring-green-500 focus:border-green-500"
                  }`}
                  disabled={isLoading}
                />
                {emailError && (
                  <p className="text-red-600 text-xs mt-1">{emailError}</p>
                )}
              </div>

              {/* Botão de pagamento */}
              <Button
                onClick={handleCreatePayment}
                disabled={isLoading}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 text-base shadow-lg"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Gerando PIX...
                  </>
                ) : (
                  <>
                    <QrCode className="w-5 h-5 mr-2" />
                    Pagar R$ {PRICE_PER_ACTIVITY.toFixed(2).replace(".", ",")} com PIX
                  </>
                )}
              </Button>

              {/* Rodapé */}
              <p className="text-xs text-gray-500 text-center mt-4">
                Amanhã você terá mais 3 atividades gratuitas novamente.
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

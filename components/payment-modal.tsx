"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { X, CreditCard, Shield, Zap, Loader2 } from "lucide-react"
import { getSessionId, PRICE_PER_ACTIVITY } from "@/lib/session"

interface PaymentModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export function PaymentModal({ isOpen, onClose, onSuccess }: PaymentModalProps) {
  const [isLoading, setIsLoading] = useState(false)

  if (!isOpen) return null

  const handlePayment = async () => {
    setIsLoading(true)

    try {
      const sessionId = getSessionId()

      const response = await fetch("/api/create-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, quantity: 1 }),
      })

      const data = await response.json()

      if (data.initPoint) {
        window.location.href = data.initPoint
      }
    } catch (error) {
      console.error("Erro ao criar pagamento:", error)
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full shadow-2xl border-2 border-amber-400 bg-white animate-in fade-in zoom-in duration-200">
        <CardContent className="p-6">
          {/* Header */}
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
                <CreditCard className="w-4 h-4 text-blue-600" />
              </div>
              <span>Pagamento seguro via Mercado Pago</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-700">
              <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                <Shield className="w-4 h-4 text-purple-600" />
              </div>
              <span>Edições ilimitadas após geração</span>
            </div>
          </div>

          {/* Botão de pagamento */}
          <Button
            onClick={handlePayment}
            disabled={isLoading}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 text-base shadow-lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Redirecionando...
              </>
            ) : (
              <>
                <CreditCard className="w-5 h-5 mr-2" />
                Pagar R$ {PRICE_PER_ACTIVITY.toFixed(2).replace(".", ",")}
              </>
            )}
          </Button>

          {/* Rodapé */}
          <p className="text-xs text-gray-500 text-center mt-4">
            Amanhã você terá mais 3 atividades gratuitas novamente.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

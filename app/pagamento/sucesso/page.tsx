"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { CheckCircle, ArrowRight, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { addPaidActivity, getRemainingFree } from "@/lib/session"

export default function PagamentoSucessoPage() {
  const searchParams = useSearchParams()
  const [credited, setCredited] = useState(false)
  const [remaining, setRemaining] = useState(0)

  useEffect(() => {
    // Adicionar crédito de atividade paga
    if (!credited) {
      addPaidActivity()
      setCredited(true)
      setRemaining(getRemainingFree())
    }
  }, [credited])

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center p-4">
      <Card className="max-w-md w-full shadow-xl border-2 border-green-400">
        <CardContent className="p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">Pagamento Confirmado!</h1>

          <p className="text-gray-600 mb-6">
            Sua atividade extra foi adicionada com sucesso. Você agora tem{" "}
            <strong className="text-green-700">{remaining} atividade(s)</strong> disponíveis.
          </p>

          <Link href="/#gerador">
            <Button className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3">
              <Sparkles className="w-5 h-5 mr-2" />
              Criar Minha Atividade
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}

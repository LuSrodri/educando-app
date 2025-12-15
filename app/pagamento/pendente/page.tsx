"use client"

import Link from "next/link"
import { Clock, Home } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export default function PagamentoPendentePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white flex items-center justify-center p-4">
      <Card className="max-w-md w-full shadow-xl border-2 border-amber-300">
        <CardContent className="p-8 text-center">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock className="w-10 h-10 text-amber-600" />
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">Pagamento Pendente</h1>

          <p className="text-gray-600 mb-6">
            Seu pagamento está sendo processado. Assim que for confirmado, sua atividade extra será liberada
            automaticamente.
          </p>

          <Link href="/">
            <Button className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-3">
              <Home className="w-5 h-5 mr-2" />
              Voltar ao Início
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}

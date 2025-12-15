"use client"

import Link from "next/link"
import { XCircle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export default function PagamentoFalhaPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50 to-white flex items-center justify-center p-4">
      <Card className="max-w-md w-full shadow-xl border-2 border-red-300">
        <CardContent className="p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-10 h-10 text-red-600" />
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">Pagamento Não Concluído</h1>

          <p className="text-gray-600 mb-6">
            Houve um problema com seu pagamento. Não se preocupe, nenhum valor foi cobrado.
          </p>

          <div className="space-y-3">
            <Link href="/#gerador">
              <Button variant="outline" className="w-full font-medium bg-transparent">
                <RefreshCw className="w-5 h-5 mr-2" />
                Tentar Novamente
              </Button>
            </Link>

            <Link href="/">
              <Button variant="ghost" className="w-full text-gray-600">
                Voltar ao Início
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

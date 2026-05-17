"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Crown, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuthGate } from "@/components/auth/auth-gate-context"

export function SubscribeButton({ label = "Assinar Premium" }: { label?: string }) {
  const { openSubscription } = useAuthGate()
  return (
    <Button
      size="lg"
      onClick={openSubscription}
      className="bg-amber-600 text-white hover:bg-amber-700"
    >
      <Crown className="h-4 w-4" />
      {label}
    </Button>
  )
}

export function CancelSubscriptionButton() {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)

  async function handleCancel() {
    if (
      !confirm(
        "Tem certeza? Sua assinatura segue ativa até o fim do período pago, depois disso não renova.",
      )
    ) {
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch("/api/assinatura/cancelar", { method: "POST" })
      if (!res.ok) {
        const err = await res.text()
        alert("Não foi possível cancelar agora: " + err)
        setSubmitting(false)
        return
      }
      router.refresh()
    } catch {
      alert("Erro de rede. Tente novamente.")
      setSubmitting(false)
    }
  }

  return (
    <Button
      variant="outline"
      onClick={handleCancel}
      disabled={submitting}
      className="border-gray-300 text-gray-700 hover:bg-gray-50"
    >
      {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
      Cancelar renovação
    </Button>
  )
}

export function ReactivateSubscriptionButton() {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)

  async function handleReactivate() {
    setSubmitting(true)
    try {
      const res = await fetch("/api/assinatura/reativar", { method: "POST" })
      if (!res.ok) {
        const err = await res.text()
        alert("Não foi possível reativar: " + err)
        setSubmitting(false)
        return
      }
      router.refresh()
    } catch {
      alert("Erro de rede. Tente novamente.")
      setSubmitting(false)
    }
  }

  return (
    <Button
      onClick={handleReactivate}
      disabled={submitting}
      className="bg-amber-600 text-white hover:bg-amber-700"
    >
      {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Crown className="h-4 w-4" />}
      Reativar assinatura
    </Button>
  )
}

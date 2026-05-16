"use client"

import Link from "next/link"
import { useState } from "react"
import { CheckCheck, Sparkles } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"

interface Props {
  theme: string
}

const REFUSAL_COOKIE = "paywall_refused"
const REFUSAL_MAX_AGE_SECONDS = 60 * 60 * 24 * 7 // 1 semana

const HIGHLIGHTS = [
  "Atividade 100% personalizada para a sua turma.",
  "De acordo com a Base Nacional Comum Curricular.",
  "Com foco na cultura da criança brasileira contemporânea.",
  "E com conceitos sempre atualizados e revisados por profissionais.",
]

export function MaterialPaywallModal({ theme }: Props) {
  const [open, setOpen] = useState(true)

  function refuse() {
    document.cookie = `${REFUSAL_COOKIE}=1; Max-Age=${REFUSAL_MAX_AGE_SECONDS}; Path=/; SameSite=Lax`
    setOpen(false)
  }

  const ctaHref = `/criar?tema=${encodeURIComponent(theme)}`

  return (
    <Dialog open={open}>
      <DialogContent
        showCloseButton={false}
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
        className="max-w-[90dvw] overflow-y-auto w-800 h-auto max-h-[90dvh] border-box"
      >
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-semibold">
            Cansada de procurar atividades no Pinterest?
          </DialogTitle>
          <DialogDescription asChild>

          </DialogDescription>
        </DialogHeader>

        <p className="text-center">Crie a atividade para a próxima aula usando IA em menos de 1 minuto!</p>

        <p className="text-center">A primeira atividade é gerada de forma 100% gratuita! Basta entrar com Google e começar.</p>

        <hr className="my-4" />

        <ul className="space-y-2 text-sm text-gray-700">
          {HIGHLIGHTS.map((item) => (
            <li key={item} className="flex justify-start items-center gap-2 text-md font-medium">
              <CheckCheck className="min-w-5 w-5 min-h-5 h-5" /> <span>{item}</span>
            </li>
          ))}
        </ul>


        <Link href={ctaHref} className="mt-2 w-auto bg-green-600 text-white hover:bg-green-700 focus:ring-4 focus:ring-green-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center inline-flex items-center mx-auto">
          <Sparkles className="mr-2 h-4 w-4" />
          Gerar atividade agora!
        </Link>

        <button
          type="button"
          onClick={refuse}
          className="mx-auto block text-xs text-red-500/80 underline underline-offset-2 hover:text-red-600"
        >
          Nunca mais receber essa promoção
        </button>
      </DialogContent>
    </Dialog>
  )
}

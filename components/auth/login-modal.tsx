"use client"

import Image from "next/image"
import Link from "next/link"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { useAuthGate } from "./auth-gate-context"
import { GoogleSignInButton } from "./google-sign-in-button"

export function LoginModal() {
  const { isLoginOpen, closeLogin, loginOpts } = useAuthGate()
  const next = loginOpts.next ?? "/criar?retry=1"

  return (
    <Dialog open={isLoginOpen} onOpenChange={(open) => !open && closeLogin()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader className="items-center text-center">
          <Image
            src="/images/educando-app-logo.png"
            alt="educando.app"
            width={48}
            height={48}
            className="mb-2 rounded-xl object-contain"
          />
          <DialogTitle>Entrar no educando.app</DialogTitle>
          <DialogDescription className="text-center">
            Acesse para gerar atividades pedagógicas personalizadas.
          </DialogDescription>
        </DialogHeader>

        <GoogleSignInButton next={next} />

        <p className="text-center text-xs leading-relaxed text-gray-500">
          Ao continuar, você concorda com os{" "}
          <Link href="/termos" className="text-amber-700 underline">
            Termos de Uso
          </Link>{" "}
          e a{" "}
          <Link href="/privacidade" className="text-amber-700 underline">
            Política de Privacidade
          </Link>
          .
        </p>
      </DialogContent>
    </Dialog>
  )
}

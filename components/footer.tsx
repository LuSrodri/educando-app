import Image from "next/image"
import Link from "next/link"
import { Mail } from "lucide-react"

export function Footer() {
  return (
    <footer className="py-8 bg-white border-t border-amber-100/70 text-gray-700">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <Image
            src="/images/educando-app-logo.png"
            alt="educando.app"
            width={80}
            height={80}
            className="h-16 w-16 rounded-lg object-contain"
          />
          <div className="text-sm text-gray-500 text-center md:text-right space-y-1">
            <p>Feito com carinho para professores do Ensino Fundamental</p>
            <p>
              Feito com ❤️ por{" "}
              <a
                href="https://lusrodri.me"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-gray-900 transition-colors"
              >
                Lucas Santos Rodrigues
              </a>
            </p>
            <p>
              <a
                href="mailto:rodrigueslucass@outlook.com.br"
                className="inline-flex items-center gap-1.5 underline hover:text-gray-900 transition-colors"
              >
                <Mail className="h-3.5 w-3.5" />
                rodrigueslucass@outlook.com.br
              </a>
            </p>
            <p className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 md:justify-end">
              <Link
                href="/privacidade"
                className="underline hover:text-gray-900 transition-colors"
              >
                Privacidade
              </Link>
              <Link
                href="/termos"
                className="underline hover:text-gray-900 transition-colors"
              >
                Termos de Uso
              </Link>
            </p>
            <p className="text-xs opacity-60">
              Lucas Santos Rodrigues Ltda — 65.101.183/0001-87
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}

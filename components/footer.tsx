import Link from "next/link"
import Image from "next/image"

export function Footer() {
  return (
    <footer className="py-8 bg-foreground text-background">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <Image
            src="/images/logo-educando.png"
            alt="educando.app"
            width={120}
            height={80}
            className="brightness-0 invert"
          />
          <div className="flex flex-col md:flex-row items-center gap-4 md:gap-8">
            <nav className="flex items-center gap-6 text-sm">
              <Link
                href="/comunidade"
                className="text-muted-foreground hover:text-background transition-colors"
              >
                Comunidade
              </Link>
              <Link
                href="/blog"
                className="text-muted-foreground hover:text-background transition-colors"
              >
                Blog
              </Link>
              <Link
                href="/historico"
                className="text-muted-foreground hover:text-background transition-colors"
              >
                Histórico
              </Link>
            </nav>
            <div className="text-sm text-muted-foreground text-center md:text-right">
              <p>Feito com carinho para professores do Ensino Fundamental</p>
              <p>
                Feito com ❤️ por{" "}
                <a
                  href="https://lusrodri.me"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-background transition-colors"
                >
                  Lucas Santos Rodrigues
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

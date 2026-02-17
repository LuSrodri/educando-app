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
    </footer>
  )
}

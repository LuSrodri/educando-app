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
          <p className="text-sm text-muted-foreground">Feito com carinho para professores do Ensino Fundamental</p>
        </div>
      </div>
    </footer>
  )
}

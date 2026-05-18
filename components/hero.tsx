import Image from "next/image"
import { ChevronDown } from "lucide-react"
import { WeeklyDropBanner } from "./weekly-drop-banner"

export function Hero() {
  return (
    <section className="relative isolate overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <Image
          src="/images/educando-app-hero.png"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
      </div>

      <div className="container mx-auto px-8 py-4 text-center min-h-[70dvh] flex items-center justify-center">
        <div className="mx-auto inline-block max-w-4xl rounded-3xl border border-white/40 bg-white/80 px-6 py-5 sm:px-16 sm:py-12 shadow-xl backdrop-blur-md">
          <h1 className="font-heading text-3xl font-bold leading-tight tracking-tight text-gray-900 sm:text-4xl md:text-6xl">
            Atividades prontas para sua turma a{" "}
            <span className="bg-gradient-to-r from-amber-500 to-amber-700 bg-clip-text text-transparent whitespace-nowrap">
              1-click
            </span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base text-gray-700 sm:mt-6 sm:text-lg md:text-xl">
            Encontre atividades por tema, série e habilidade BNCC.
          </p>

          <WeeklyDropBanner />

          <a
            href="#materiais"
            className="group mt-6 inline-flex flex-col items-center gap-1 font-semibold text-gray-600 transition-colors hover:text-gray-800 [text-shadow:_0_1px_2px_rgb(0_0_0_/_0.15)]"
          >
            <ChevronDown className="h-10 w-10 animate-bounce transition-transform group-hover:scale-110" />
          </a>
        </div>
      </div>
    </section>
  )
}

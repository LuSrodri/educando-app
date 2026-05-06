import Image from "next/image"
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

      <div className="container mx-auto px-4 py-16 text-center sm:py-24">
        <div className="mx-auto inline-block max-w-4xl rounded-3xl border border-white/40 bg-white/80 p-6 shadow-xl backdrop-blur-md sm:p-10">
          <h1 className="font-heading text-3xl font-bold leading-tight tracking-tight text-gray-900 sm:text-4xl md:text-6xl">
            Atividades prontas para sua turma a{" "}
            <span className="bg-gradient-to-r from-amber-500 to-amber-700 bg-clip-text text-transparent whitespace-nowrap">
              1-click
            </span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base text-gray-700 sm:mt-6 sm:text-lg md:text-xl">
            Encontre atividades gratuitas por tema, série e habilidade BNCC.
          </p>

          <WeeklyDropBanner />
        </div>
      </div>
    </section>
  )
}

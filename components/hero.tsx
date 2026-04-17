import Image from "next/image"
import { BadgeCheck } from "lucide-react"

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

      <div className="container mx-auto px-4 py-20 text-center sm:py-24 md:py-32">
        <div className="mx-auto inline-block max-w-4xl rounded-3xl border border-white/40 bg-white/80 p-6 shadow-xl backdrop-blur-md sm:p-10">
          <h1 className="font-heading text-3xl font-bold leading-tight tracking-tight text-gray-900 sm:text-4xl md:text-6xl">
            O seu plano de aula a{" "}
            <span className="bg-gradient-to-r from-amber-500 to-amber-700 bg-clip-text text-transparent">
              1-click
            </span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base text-gray-700 sm:mt-6 sm:text-lg md:text-xl">
            Atividades e materiais de apoio pedagógicos para quem constrói o futuro do Brasil.
          </p>

          <div className="mx-auto mt-7 inline-flex max-w-full items-center gap-2 rounded-full border border-amber-300/80 bg-amber-50/90 px-4 py-2 text-xs font-medium text-amber-800 shadow-sm sm:mt-8 sm:text-sm">
            <BadgeCheck className="h-4 w-4 shrink-0 text-amber-600" aria-hidden />
            <span>
              De acordo com as melhores práticas e com a Base Nacional Comum Curricular
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}

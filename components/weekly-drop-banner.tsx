import { Sparkles, Calendar } from "lucide-react"

export function WeeklyDropBanner() {
  return (
    <section className="container mx-auto px-4 pt-6 sm:pt-8">
      <div className="relative overflow-hidden rounded-2xl border border-amber-200/80 bg-gradient-to-br from-amber-50 via-amber-50/50 to-white px-4 py-4 shadow-sm sm:px-6 sm:py-5">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-amber-300/30 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-16 left-1/3 h-32 w-32 rounded-full bg-amber-200/20 blur-3xl"
        />

        <div className="relative flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:gap-5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 shadow-md shadow-amber-500/20 sm:h-12 sm:w-12">
            <Sparkles className="h-5 w-5 text-white sm:h-6 sm:w-6" />
          </div>

          <div className="min-w-0 flex-1">
            <h2 className="font-heading text-base font-bold text-gray-900 sm:text-lg">
              Novas atividades todo domingo
            </h2>
            <p className="mt-0.5 text-sm leading-relaxed text-gray-600 sm:text-[15px]">
              Geramos 3 fichas inéditas toda semana, alinhadas à BNCC e baseadas nos temas mais buscados pela comunidade.
            </p>
          </div>

          <div className="hidden shrink-0 items-center gap-1.5 self-start rounded-full border border-amber-200 bg-white/80 px-3 py-1.5 text-xs font-medium text-amber-800 backdrop-blur-sm md:flex">
            <Calendar className="h-3.5 w-3.5" />
            Próximo: domingo 8h
          </div>
        </div>
      </div>
    </section>
  )
}

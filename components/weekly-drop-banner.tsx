export function WeeklyDropBanner() {
  return (
    <section className="container mx-auto mt-8">
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
          <div className="min-w-0 flex-1">
            <h2 className="font-heading text-base font-bold text-gray-900 sm:text-lg">
              Novas atividades toda quarta-feira e domingo
            </h2>
            <p className="mt-0.5 text-sm leading-relaxed text-gray-600 sm:text-[15px]">
              Geramos fichas inéditas toda semana, alinhadas à BNCC e baseadas nos temas mais buscados pela comunidade.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

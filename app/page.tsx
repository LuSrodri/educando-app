"use client"

import { useRef } from "react"
import { HeroGenerator, type HeroGeneratorRef } from "@/components/hero-generator"
import { ActivityHistoryCarousel } from "@/components/activity-history"
import { CommunitySection } from "@/components/community-home"
import { Footer } from "@/components/footer"

export default function Home() {
  const generatorRef = useRef<HeroGeneratorRef>(null)

  return (
    <main className="min-h-screen bg-background">
      <HeroGenerator ref={generatorRef} />

      <div className="text-center py-3 bg-amber-50 border-t border-amber-100">
        <p className="text-sm text-gray-500">
          Precisando de suporte? Entre em contato via e-mail:{" "}
          <a
            href="mailto:rodrigueslucass@outlook.com.br"
            className="text-amber-600 hover:text-amber-700 font-medium underline underline-offset-2 cursor-pointer"
          >
            rodrigueslucass@outlook.com.br
          </a>
        </p>
      </div>

      {/* History & Community section below generator */}
      <div className="container mx-auto px-4 py-8 space-y-10">
        <ActivityHistoryCarousel />

        <div id="comunidade">
          <CommunitySection />
        </div>
      </div>

      <Footer />
    </main>
  )
}

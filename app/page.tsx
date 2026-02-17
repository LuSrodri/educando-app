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

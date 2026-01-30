"use client"

import { useRef } from "react"
import { HeroGenerator, type HeroGeneratorRef } from "@/components/hero-generator"
import { Features } from "@/components/features"
import { Examples } from "@/components/examples"
import { CommunitySection } from "@/components/community-section"
import { BlogSection } from "@/components/blog-section"
import { Footer } from "@/components/footer"

export default function Home() {
  const generatorRef = useRef<HeroGeneratorRef>(null)

  const handleSelectExample = (prompt: string) => {
    if (generatorRef.current) {
      generatorRef.current.setPromptValue(prompt)
      generatorRef.current.focusPrompt()
    }
  }

  return (
    <main className="min-h-screen bg-background">
      <HeroGenerator ref={generatorRef} />
      <Features />
      <Examples onSelectExample={handleSelectExample} />
      <CommunitySection />
      <BlogSection />
      <Footer />
    </main>
  )
}

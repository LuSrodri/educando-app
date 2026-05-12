import type { Metadata } from "next"
import { SiteHeader } from "@/components/site-header"
import { MaterialsSection } from "@/components/materials-section"
import { Footer } from "@/components/footer"
import { getAllActivities } from "@/lib/activities"
import { createServerClient } from "@/lib/supabase/server"

export const revalidate = 300

export const metadata: Metadata = {
  title: "Buscar atividades | educando.app",
  description: "Encontre materiais pedagógicos por tema, título ou código BNCC.",
  robots: { index: false, follow: true },
}

async function fetchDirectoryState() {
  const supabase = createServerClient()
  const [activities, countResult] = await Promise.all([
    getAllActivities(24),
    supabase
      .from("activities")
      .select("id", { count: "exact", head: true })
      .not("title", "is", null)
      .is("user_id", null),
  ])
  return {
    activities,
    total: countResult.count ?? activities.length,
  }
}

interface SearchPageProps {
  searchParams: Promise<{ tema?: string }>
}

export default async function BuscarPage({ searchParams }: SearchPageProps) {
  const { tema } = await searchParams
  const { activities, total } = await fetchDirectoryState()
  const initialQuery = (tema ?? "").trim().slice(0, 160)

  return (
    <>
      <SiteHeader />
      <main className="min-h-screen bg-background">
        <MaterialsSection
          initialActivities={activities}
          initialTotal={total}
          initialQuery={initialQuery || undefined}
          syncUrl
        />
      </main>
      <Footer />
    </>
  )
}

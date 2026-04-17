import { SiteHeader } from "@/components/site-header"
import { Hero } from "@/components/hero"
import { MaterialsSection } from "@/components/materials-section"
import { Footer } from "@/components/footer"
import { getAllActivities } from "@/lib/activities"
import { createServerClient } from "@/lib/supabase/server"

export const revalidate = 300

async function fetchDirectoryState() {
  const supabase = createServerClient()
  const [activities, countResult] = await Promise.all([
    getAllActivities(24),
    supabase
      .from("activities")
      .select("id", { count: "exact", head: true })
      .not("title", "is", null),
  ])
  return {
    activities,
    total: countResult.count ?? activities.length,
  }
}

export default async function Home() {
  const { activities, total } = await fetchDirectoryState()

  return (
    <>
      <SiteHeader />
      <main className="min-h-screen bg-background">
        <Hero />
        <MaterialsSection initialActivities={activities} initialTotal={total} />
      </main>
      <Footer />
    </>
  )
}

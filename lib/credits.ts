import { createServerClient } from "@/lib/supabase/server"

export const FREE_FORTNIGHTLY_LIMIT = 3

/**
 * Returns the start date of the current fortnight (quinzena):
 * - Days 1–15  → YYYY-MM-01
 * - Days 16–31 → YYYY-MM-16
 */
function getFortnightStart(): string {
  const now = new Date()
  const year = now.getUTCFullYear()
  const month = String(now.getUTCMonth() + 1).padStart(2, "0")
  const day = now.getUTCDate()
  const half = day <= 15 ? "01" : "16"
  return `${year}-${month}-${half}`
}

export async function getFortnightlyUsage(browserId: string): Promise<number> {
  const supabase = createServerClient()
  const period = getFortnightStart()

  const { data } = await supabase
    .from("daily_usage")
    .select("count")
    .eq("browser_id", browserId)
    .eq("usage_date", period)
    .single()

  return data?.count || 0
}

export async function incrementFortnightlyUsage(browserId: string): Promise<number> {
  const supabase = createServerClient()
  const period = getFortnightStart()

  const { data: existing } = await supabase
    .from("daily_usage")
    .select("count")
    .eq("browser_id", browserId)
    .eq("usage_date", period)
    .single()

  const newCount = (existing?.count || 0) + 1

  const { error } = await supabase.from("daily_usage").upsert(
    {
      browser_id: browserId,
      usage_date: period,
      count: newCount,
    },
    {
      onConflict: "browser_id,usage_date",
    }
  )

  if (error) {
    console.error("Error incrementing fortnightly usage:", error)
  }

  return newCount
}

export async function canGenerateFree(browserId: string): Promise<boolean> {
  const usage = await getFortnightlyUsage(browserId)
  return usage < FREE_FORTNIGHTLY_LIMIT
}

export async function getRemainingFree(browserId: string): Promise<number> {
  const usage = await getFortnightlyUsage(browserId)
  return Math.max(0, FREE_FORTNIGHTLY_LIMIT - usage)
}

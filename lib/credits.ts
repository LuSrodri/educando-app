import { createServerClient } from "@/lib/supabase/server"

export const FREE_DAILY_LIMIT = 3
export const PRICE_PER_ACTIVITY = 1.99

export async function getDailyUsage(browserId: string): Promise<number> {
  const supabase = createServerClient()
  const today = new Date().toISOString().split("T")[0]

  const { data } = await supabase
    .from("daily_usage")
    .select("count")
    .eq("browser_id", browserId)
    .eq("usage_date", today)
    .single()

  return data?.count || 0
}

export async function incrementDailyUsage(browserId: string): Promise<number> {
  const supabase = createServerClient()
  const today = new Date().toISOString().split("T")[0]

  // First, try to get existing record
  const { data: existing } = await supabase
    .from("daily_usage")
    .select("count")
    .eq("browser_id", browserId)
    .eq("usage_date", today)
    .single()

  const newCount = (existing?.count || 0) + 1

  // Upsert the record
  const { error } = await supabase.from("daily_usage").upsert(
    {
      browser_id: browserId,
      usage_date: today,
      count: newCount,
    },
    {
      onConflict: "browser_id,usage_date",
    }
  )

  if (error) {
    console.error("Error incrementing daily usage:", error)
  }

  return newCount
}

export async function getExtraCredits(browserId: string): Promise<number> {
  const supabase = createServerClient()

  const { data } = await supabase
    .from("credits")
    .select("count")
    .eq("browser_id", browserId)
    .single()

  return data?.count || 0
}

export async function addExtraCredit(browserId: string): Promise<number> {
  const supabase = createServerClient()

  // First, get current credits
  const { data: existing } = await supabase
    .from("credits")
    .select("count")
    .eq("browser_id", browserId)
    .single()

  const newCount = (existing?.count || 0) + 1

  // Upsert credits
  const { error } = await supabase.from("credits").upsert(
    {
      browser_id: browserId,
      count: newCount,
    },
    {
      onConflict: "browser_id",
    }
  )

  if (error) {
    console.error("Error adding credit:", error)
  }

  return newCount
}

export async function useExtraCredit(browserId: string): Promise<boolean> {
  const supabase = createServerClient()

  // Get current credits
  const { data: existing } = await supabase
    .from("credits")
    .select("count")
    .eq("browser_id", browserId)
    .single()

  const currentCredits = existing?.count || 0

  if (currentCredits <= 0) {
    return false
  }

  // Decrement credits
  const { error } = await supabase.from("credits").upsert(
    {
      browser_id: browserId,
      count: currentCredits - 1,
    },
    {
      onConflict: "browser_id",
    }
  )

  if (error) {
    console.error("Error using credit:", error)
    return false
  }

  return true
}

export async function canGenerateFree(browserId: string): Promise<boolean> {
  const usage = await getDailyUsage(browserId)
  return usage < FREE_DAILY_LIMIT
}

export async function getRemainingFree(browserId: string): Promise<number> {
  const usage = await getDailyUsage(browserId)
  return Math.max(0, FREE_DAILY_LIMIT - usage)
}

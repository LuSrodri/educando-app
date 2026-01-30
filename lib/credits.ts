import { createServerClient } from "@/lib/supabase/server"

export const FREE_WEEKLY_LIMIT = 3
export const WEEKLY_PERIOD_DAYS = 8

// Legacy exports for backwards compatibility
export const FREE_DAILY_LIMIT = FREE_WEEKLY_LIMIT

export const PRICING_PACKAGES = [
  { id: "single", credits: 1, price: 3.90, label: "1 atividade", badge: null },
  { id: "pack_3", credits: 3, price: 9.90, label: "3 atividades", badge: "Mais popular" },
  { id: "pack_10", credits: 10, price: 19.90, label: "10 atividades", badge: "Melhor valor" },
] as const

export type PricingPackage = typeof PRICING_PACKAGES[number]

export function getPackageById(packageId: string): PricingPackage | undefined {
  return PRICING_PACKAGES.find(pkg => pkg.id === packageId)
}

// Legacy export
export const PRICE_PER_ACTIVITY = PRICING_PACKAGES[0].price

export async function getWeeklyUsage(browserId: string): Promise<number> {
  const supabase = createServerClient()
  const eightDaysAgo = new Date()
  eightDaysAgo.setDate(eightDaysAgo.getDate() - WEEKLY_PERIOD_DAYS)
  const startDate = eightDaysAgo.toISOString().split("T")[0]

  const { data } = await supabase
    .from("daily_usage")
    .select("count")
    .eq("browser_id", browserId)
    .gte("usage_date", startDate)

  return data?.reduce((sum, row) => sum + (row.count || 0), 0) || 0
}

export function getNextResetDate(): Date {
  const now = new Date()
  const nextReset = new Date(now)
  nextReset.setDate(now.getDate() + WEEKLY_PERIOD_DAYS)
  return nextReset
}

// Legacy function name kept for backwards compatibility
export async function getDailyUsage(browserId: string): Promise<number> {
  return getWeeklyUsage(browserId)
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

export async function addExtraCredits(browserId: string, creditCount: number = 1): Promise<number> {
  const supabase = createServerClient()

  // First, get current credits
  const { data: existing } = await supabase
    .from("credits")
    .select("count")
    .eq("browser_id", browserId)
    .single()

  const newCount = (existing?.count || 0) + creditCount

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
    console.error("Error adding credits:", error)
  }

  return newCount
}

// Legacy alias for backwards compatibility
export const addExtraCredit = (browserId: string) => addExtraCredits(browserId, 1)

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
  const usage = await getWeeklyUsage(browserId)
  return usage < FREE_WEEKLY_LIMIT
}

export async function getRemainingFree(browserId: string): Promise<number> {
  const usage = await getWeeklyUsage(browserId)
  return Math.max(0, FREE_WEEKLY_LIMIT - usage)
}

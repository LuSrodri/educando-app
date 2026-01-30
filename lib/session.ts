// Sistema de sessão e controle de uso diário

export function getSessionId(): string {
  if (typeof window === "undefined") return ""

  let sessionId = localStorage.getItem("educando_session_id")
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`
    localStorage.setItem("educando_session_id", sessionId)
  }
  return sessionId
}

export function getTodayKey(): string {
  const today = new Date()
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`
}

export function getDailyUsage(): number {
  if (typeof window === "undefined") return 0

  const todayKey = getTodayKey()
  const usageData = localStorage.getItem("educando_daily_usage")

  if (!usageData) return 0

  try {
    const data = JSON.parse(usageData)
    if (data.date !== todayKey) {
      // Novo dia, resetar contador
      localStorage.setItem("educando_daily_usage", JSON.stringify({ date: todayKey, count: 0 }))
      return 0
    }
    return data.count || 0
  } catch {
    return 0
  }
}

export function incrementDailyUsage(): number {
  if (typeof window === "undefined") return 0

  const todayKey = getTodayKey()
  const currentUsage = getDailyUsage()
  const newCount = currentUsage + 1

  localStorage.setItem("educando_daily_usage", JSON.stringify({ date: todayKey, count: newCount }))

  return newCount
}

export function getExtraCredits(): number {
  if (typeof window === "undefined") return 0

  const creditsData = localStorage.getItem("educando_extra_credits")

  if (!creditsData) return 0

  try {
    const data = JSON.parse(creditsData)
    return data.count || 0
  } catch {
    return 0
  }
}

export function addExtraCredits(creditCount: number = 1): void {
  if (typeof window === "undefined") return

  const currentCredits = getExtraCredits()
  localStorage.setItem("educando_extra_credits", JSON.stringify({ count: currentCredits + creditCount }))
}

// Legacy alias for backwards compatibility
export const addExtraCredit = () => addExtraCredits(1)

export function useExtraCredit(): boolean {
  if (typeof window === "undefined") return false

  const currentCredits = getExtraCredits()
  if (currentCredits > 0) {
    localStorage.setItem("educando_extra_credits", JSON.stringify({ count: currentCredits - 1 }))
    return true
  }
  return false
}

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

export function canGenerateFree(): boolean {
  const usage = getDailyUsage()
  return usage < FREE_DAILY_LIMIT
}

export function getRemainingFree(): number {
  const usage = getDailyUsage()
  const remaining = FREE_DAILY_LIMIT - usage
  return Math.max(0, remaining)
}

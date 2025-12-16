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

export function addExtraCredit(): void {
  if (typeof window === "undefined") return

  const currentCredits = getExtraCredits()
  localStorage.setItem("educando_extra_credits", JSON.stringify({ count: currentCredits + 1 }))
}

export function useExtraCredit(): boolean {
  if (typeof window === "undefined") return false

  const currentCredits = getExtraCredits()
  if (currentCredits > 0) {
    localStorage.setItem("educando_extra_credits", JSON.stringify({ count: currentCredits - 1 }))
    return true
  }
  return false
}

export const FREE_DAILY_LIMIT = 3
export const PRICE_PER_ACTIVITY = 1.99

export function canGenerateFree(): boolean {
  const usage = getDailyUsage()
  return usage < FREE_DAILY_LIMIT
}

export function getRemainingFree(): number {
  const usage = getDailyUsage()
  const remaining = FREE_DAILY_LIMIT - usage
  return Math.max(0, remaining)
}

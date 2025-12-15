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

export function getPaidActivities(): number {
  if (typeof window === "undefined") return 0

  const todayKey = getTodayKey()
  const paidData = localStorage.getItem("educando_paid_activities")

  if (!paidData) return 0

  try {
    const data = JSON.parse(paidData)
    if (data.date !== todayKey) {
      localStorage.setItem("educando_paid_activities", JSON.stringify({ date: todayKey, count: 0 }))
      return 0
    }
    return data.count || 0
  } catch {
    return 0
  }
}

export function addPaidActivity(): void {
  if (typeof window === "undefined") return

  const todayKey = getTodayKey()
  const currentPaid = getPaidActivities()

  localStorage.setItem("educando_paid_activities", JSON.stringify({ date: todayKey, count: currentPaid + 1 }))
}

export const FREE_DAILY_LIMIT = 3
export const PRICE_PER_ACTIVITY = 1.99

export function canGenerateFree(): boolean {
  const usage = getDailyUsage()
  const paid = getPaidActivities()
  return usage < FREE_DAILY_LIMIT + paid
}

export function getRemainingFree(): number {
  const usage = getDailyUsage()
  const paid = getPaidActivities()
  const remaining = FREE_DAILY_LIMIT + paid - usage
  return Math.max(0, remaining)
}

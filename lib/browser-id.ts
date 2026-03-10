const BROWSER_ID_KEY = "educando_session_id"

export function getOrCreateBrowserId(): string {
  if (typeof window === "undefined") return ""

  let browserId = localStorage.getItem(BROWSER_ID_KEY)
  if (!browserId) {
    browserId = `session_${crypto.randomUUID()}`
    localStorage.setItem(BROWSER_ID_KEY, browserId)
  }
  return browserId
}

export function getBrowserId(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem(BROWSER_ID_KEY)
}

export async function syncBrowserWithSupabase(browserId: string): Promise<void> {
  try {
    const response = await fetch("/api/browser", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ browserId }),
    })

    if (!response.ok) {
      console.error("Failed to sync browser with Supabase")
    }
  } catch (error) {
    console.error("Error syncing browser:", error)
  }
}

export async function initializeBrowser(): Promise<string> {
  const browserId = getOrCreateBrowserId()
  await syncBrowserWithSupabase(browserId)
  return browserId
}

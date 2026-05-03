// Cloudflare Turnstile server-side verification.

const TURNSTILE_VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify"

export async function verifyTurnstileToken(
  token: string | null | undefined,
  remoteIp?: string | null,
): Promise<boolean> {
  const secret = process.env.CLOUDFLARE_TURNSTILE_SECRET_KEY
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      console.error("[turnstile] CLOUDFLARE_TURNSTILE_SECRET_KEY missing in production — blocking request")
      return false
    }
    console.warn("[turnstile] CLOUDFLARE_TURNSTILE_SECRET_KEY missing — skipping verification in dev")
    return true
  }
  if (!token || typeof token !== "string" || token.length < 8) return false

  const form = new FormData()
  form.append("secret", secret)
  form.append("response", token)
  if (remoteIp) form.append("remoteip", remoteIp)

  try {
    const res = await fetch(TURNSTILE_VERIFY_URL, { method: "POST", body: form })
    if (!res.ok) return false
    const data = (await res.json()) as { success?: boolean }
    return Boolean(data.success)
  } catch (err) {
    console.error("[turnstile] verify error:", (err as Error).message)
    return false
  }
}

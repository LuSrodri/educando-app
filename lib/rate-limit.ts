import { createServerClient } from "@/lib/supabase/server"

// Thin wrapper over the public.rate_limit_check RPC. Returns true when the
// request should proceed, false when the caller is over the limit for the
// current window.

export async function rateLimit(
  bucket: string,
  key: string,
  maxRequests: number,
  windowSeconds: number,
): Promise<boolean> {
  if (!key) return true // anonymous callers aren't rate-limited by the helper
  try {
    const supabase = createServerClient()
    const { data, error } = await supabase.rpc("rate_limit_check", {
      p_bucket: bucket,
      p_key: key,
      p_limit: maxRequests,
      p_window_seconds: windowSeconds,
    })
    if (error) {
      console.error("[rate-limit] rpc failed:", error.message)
      return true // fail open
    }
    return Boolean(data)
  } catch (err) {
    console.error("[rate-limit] exception:", (err as Error).message)
    return true
  }
}

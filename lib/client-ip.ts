// Extracts the caller's IP, normalising loopback variants so dev sessions
// stay stable across IPv4/IPv6 transitions.

export function extractClientIp(request: Request): string | null {
  // cf-connecting-ip is set by Cloudflare and cannot be spoofed by the client.
  const cfIp = request.headers.get("cf-connecting-ip")
  if (cfIp) return normalize(cfIp.trim())

  // x-real-ip is set by the closest trusted reverse proxy (Vercel edge, nginx).
  const real = request.headers.get("x-real-ip")
  if (real) return normalize(real.trim())

  // XFF: use the LAST hop (appended by our proxy), not the first (client-controlled).
  const xff = request.headers.get("x-forwarded-for")
  if (xff) {
    const hops = xff.split(",")
    const last = hops[hops.length - 1]?.trim()
    if (last) return normalize(last)
  }

  return null
}

function normalize(ip: string): string {
  const trimmed = ip.toLowerCase()
  if (
    trimmed === "::1" ||
    trimmed === "127.0.0.1" ||
    trimmed === "0:0:0:0:0:0:0:1" ||
    trimmed.startsWith("::ffff:127.") ||
    trimmed.startsWith("127.")
  ) {
    return "loopback"
  }
  return trimmed
}

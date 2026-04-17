import { createHash } from "node:crypto"
import { createServerClient } from "@/lib/supabase/server"

// Identity resolution + anti-abuse.
//
// The earlier design kept a single row per (fp_id OR ip_hash) and flagged any
// change within a 1h window as fraud. That breaks legitimate scenarios: shared
// household/school networks have many fingerprints behind one IP, and a single
// teacher may hit the app from home and school on the same day.
//
// The model here keeps one row per (fp_id, ip_hash) pair and detects abuse via
// rate counters on the security_identities log:
//   - MAX_FPS_PER_IP_PER_HOUR: a single public IP emitting many brand-new
//     fp_ids in one hour looks like localStorage-wiping automation.
//   - MAX_IPS_PER_FP_PER_HOUR: a single fp_id popping up from many distinct
//     IPs in one hour looks like proxy/VPN hopping.
// Both thresholds are generous enough for classrooms and roaming teachers.

const WINDOW_MS = 60 * 60 * 1000
const MAX_FPS_PER_IP_PER_HOUR = 10
const MAX_IPS_PER_FP_PER_HOUR = 5

export interface ResolvedIdentity {
  fingerprintHash: string | null
  isFraud: boolean
  ip: string | null
}

export function extractIp(request: Request): string | null {
  const xff = request.headers.get("x-forwarded-for")
  if (xff) {
    const first = xff.split(",")[0]?.trim()
    if (first) return normalizeIp(first)
  }
  const real = request.headers.get("x-real-ip")
  if (real) return normalizeIp(real.trim())
  const cfIp = request.headers.get("cf-connecting-ip")
  if (cfIp) return normalizeIp(cfIp.trim())
  return null
}

// Collapse IPv4/IPv6 loopback variants. Keeps dev sessions stable since the
// same tab can swap between 127.0.0.1 and ::1 between requests.
function normalizeIp(ip: string): string {
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

function sha256Hex(value: string): string {
  return createHash("sha256").update(value).digest("hex")
}

function salt(): string {
  return (
    process.env.IDENTITY_SALT ??
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    "educando-app-default-salt"
  )
}

export async function resolveIdentity(
  request: Request,
  explicitFpId?: string | null,
): Promise<ResolvedIdentity> {
  const fpId = (explicitFpId ?? request.headers.get("x-fp-id") ?? "").trim() || null
  const ip = extractIp(request)

  if (!fpId || !ip) {
    return { fingerprintHash: null, isFraud: false, ip }
  }

  const ipHash = sha256Hex(`${ip}:${salt()}`)
  const fingerprintHash = sha256Hex(`${fpId}:${ipHash}`)

  const supabase = createServerClient()
  const nowIso = new Date().toISOString()

  const { data: exact } = await supabase
    .from("security_identities")
    .select("id")
    .eq("fingerprint_hash", fingerprintHash)
    .maybeSingle()

  if (exact) {
    await supabase
      .from("security_identities")
      .update({ last_seen_at: nowIso })
      .eq("id", exact.id)
    return { fingerprintHash, isFraud: false, ip }
  }

  // Rate-limit the registration of brand-new identities.
  const windowStart = new Date(Date.now() - WINDOW_MS).toISOString()

  const [{ count: ipFpCount }, { count: fpIpCount }] = await Promise.all([
    supabase
      .from("security_identities")
      .select("id", { count: "exact", head: true })
      .eq("ip_hash", ipHash)
      .gt("created_at", windowStart),
    supabase
      .from("security_identities")
      .select("id", { count: "exact", head: true })
      .eq("fp_id", fpId)
      .gt("created_at", windowStart),
  ])

  if ((ipFpCount ?? 0) >= MAX_FPS_PER_IP_PER_HOUR) {
    return { fingerprintHash, isFraud: true, ip }
  }
  if ((fpIpCount ?? 0) >= MAX_IPS_PER_FP_PER_HOUR) {
    return { fingerprintHash, isFraud: true, ip }
  }

  await supabase.from("security_identities").insert({
    fingerprint_hash: fingerprintHash,
    fp_id: fpId,
    ip_hash: ipHash,
    fp_last_changed: nowIso,
    ip_last_changed: nowIso,
  })

  return { fingerprintHash, isFraud: false, ip }
}

import { createHash } from "node:crypto"
import { createServerClient } from "@/lib/supabase/server"

// Phase 7 identity layer. Turns {fp_id from client header, IP from request}
// into a server-side fingerprint_hash and enforces rotation throttling: the
// fp_id OR the IP can change once per hour, but never both at once.

const ROTATION_WINDOW_MS = 60 * 60 * 1000
// Epoch used for fp_last_changed / ip_last_changed when the identity is first
// inserted. Using an actual "long ago" timestamp means the first legitimate
// rotation isn't misread as fraud (now - inserted_at would otherwise be 0s).
const NEVER_ROTATED_ISO = "1970-01-01T00:00:00Z"

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

// Collapse IPv4/IPv6 loopback variants into a single "localhost" bucket. This
// keeps dev sessions stable: a single tab can alternate between 127.0.0.1 and
// ::1 between requests on different platforms, and that shouldn't look like
// an IP rotation.
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

  const [{ data: byFp }, { data: byIp }] = await Promise.all([
    supabase.from("security_identities").select("*").eq("fp_id", fpId).maybeSingle(),
    supabase.from("security_identities").select("*").eq("ip_hash", ipHash).maybeSingle(),
  ])

  const now = Date.now()

  // Both fp_id and ip_hash already live on different identities: fraud.
  if (byFp && byIp && byFp.id !== byIp.id) {
    return { fingerprintHash, isFraud: true, ip }
  }

  // Same fp_id, different IP → legitimate rotation only if ip_last_changed is
  // older than the window.
  if (byFp) {
    const lastIpChange = new Date(byFp.ip_last_changed).getTime()
    if (now - lastIpChange < ROTATION_WINDOW_MS) {
      return { fingerprintHash, isFraud: true, ip }
    }
    await supabase
      .from("security_identities")
      .update({
        ip_hash: ipHash,
        fingerprint_hash: fingerprintHash,
        ip_last_changed: nowIso,
        last_seen_at: nowIso,
      })
      .eq("id", byFp.id)
    return { fingerprintHash, isFraud: false, ip }
  }

  // Same IP, different fp_id → legitimate rotation only if fp hasn't rotated
  // in the window.
  if (byIp) {
    const lastFpChange = new Date(byIp.fp_last_changed).getTime()
    if (now - lastFpChange < ROTATION_WINDOW_MS) {
      return { fingerprintHash, isFraud: true, ip }
    }
    await supabase
      .from("security_identities")
      .update({
        fp_id: fpId,
        fingerprint_hash: fingerprintHash,
        fp_last_changed: nowIso,
        last_seen_at: nowIso,
      })
      .eq("id", byIp.id)
    return { fingerprintHash, isFraud: false, ip }
  }

  // First encounter — never seen fp_id nor this ip_hash. Seed rotation
  // timestamps with the epoch so the first legitimate rotation isn't
  // misclassified as fraud.
  await supabase.from("security_identities").insert({
    fingerprint_hash: fingerprintHash,
    fp_id: fpId,
    ip_hash: ipHash,
    fp_last_changed: NEVER_ROTATED_ISO,
    ip_last_changed: NEVER_ROTATED_ISO,
  })
  return { fingerprintHash, isFraud: false, ip }
}

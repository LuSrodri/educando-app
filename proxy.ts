import { createServerClient } from "@supabase/ssr"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import type { Database } from "@/lib/supabase/types"

export async function proxy(request: NextRequest) {
  // ─── Supabase: refresca a sessão por cookie ────────────────────────────────
  // Em Next 16, o "proxy" (antigo middleware) é o único lugar onde dá pra
  // escrever cookies de forma confiável; @supabase/ssr usa esse hook pra
  // rotacionar o JWT antes que ele expire.
  let response = NextResponse.next({ request })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (supabaseUrl && supabaseAnonKey) {
    const supabase = createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          )
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          )
        },
      },
    })

    // getClaims() valida o JWT localmente (assinatura + expiração) e dispara
    // o refresh via setAll quando necessário. Doc oficial recomenda
    // explicitamente getClaims() no proxy — getUser() faz round-trip ao auth
    // server e é caro pra rodar a cada request.
    await supabase.auth.getClaims()
  }

  // ─── Cabeçalhos de segurança ───────────────────────────────────────────────
  const supabaseHost = supabaseUrl ? new URL(supabaseUrl).host : "*.supabase.co"

  const csp = [
    "default-src 'self'",
    // Allow all HTTPS images: Supabase image transformation serves via Cloudflare CDN
    // which uses different hostnames than the project URL, so we can't enumerate them
    "img-src 'self' data: blob: https:",
    // Next.js App Router requires unsafe-inline for hydration scripts. Cloudflare
    // Turnstile loads api.js and its inner challenge iframe from
    // challenges.cloudflare.com.
    "script-src 'self' 'unsafe-inline' https://va.vercel-scripts.com https://challenges.cloudflare.com https://www.clarity.ms",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    // Include wss: for Supabase realtime WebSocket connections and Turnstile
    // verification traffic.
    `connect-src 'self' https://${supabaseHost} wss://${supabaseHost} https://va.vercel-scripts.com https://vitals.vercel-insights.com https://challenges.cloudflare.com https://www.clarity.ms`,
    // Turnstile renders the challenge UI inside a nested iframe from
    // challenges.cloudflare.com — whitelist it here so the widget can mount.
    "frame-src https://challenges.cloudflare.com",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; ")

  response.headers.set("Content-Security-Policy", csp)
  response.headers.set("X-Frame-Options", "DENY")
  response.headers.set("X-Content-Type-Options", "nosniff")
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin")
  response.headers.set(
    "Permissions-Policy",
    [
      "camera=()",
      "microphone=()",
      "geolocation=()",
      // Cloudflare Turnstile needs these sensor APIs inside its iframe to
      // collect anti-bot signals. Granting to self + the Turnstile origin.
      'accelerometer=(self "https://challenges.cloudflare.com")',
      'gyroscope=(self "https://challenges.cloudflare.com")',
      'magnetometer=(self "https://challenges.cloudflare.com")',
      'xr-spatial-tracking=(self "https://challenges.cloudflare.com")',
    ].join(", "),
  )
  response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains")
  response.headers.set("X-DNS-Prefetch-Control", "on")

  // Bloqueia caching de respostas que podem carregar Set-Cookie de sessão
  // refrescada — sem isso, CDN (Vercel Edge / Cloudflare) pode servir o
  // cookie de um usuário pra outro. Doc Supabase advanced-guide § "CDN".
  response.headers.set("Cache-Control", "private, no-store")

  return response
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}

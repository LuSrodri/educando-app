import { NextResponse, type NextRequest } from "next/server"
import { createSSRServerClient } from "@/lib/supabase/ssr-server"

function safeRedirect(url: string) {
  const response = NextResponse.redirect(url)
  // Nunca cachear o callback — a resposta carrega Set-Cookie de sessão.
  response.headers.set("Cache-Control", "private, no-store")
  return response
}

function buildRedirectUrl(request: NextRequest, path: string) {
  const { origin } = new URL(request.url)
  const forwardedHost = request.headers.get("x-forwarded-host")
  const forwardedProto = request.headers.get("x-forwarded-proto") ?? "https"
  const isDev = process.env.NODE_ENV === "development"

  // Em produção atrás de proxy/load balancer (Vercel), o `origin` pode não
  // refletir o host público. Reconstrói via X-Forwarded-Host quando presente.
  if (!isDev && forwardedHost) {
    return `${forwardedProto}://${forwardedHost}${path}`
  }
  return `${origin}${path}`
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get("code")
  const nextParam = searchParams.get("next") ?? "/criar?retry=1"

  // Bloqueia open-redirect: só aceita paths relativos do próprio app.
  // O check do `//` impede protocol-relative URLs (`//attacker.com/...`).
  const next =
    nextParam.startsWith("/") && !nextParam.startsWith("//") && !nextParam.startsWith("/\\")
      ? nextParam
      : "/criar?retry=1"

  if (!code) {
    return safeRedirect(buildRedirectUrl(request, "/criar?login=1"))
  }

  const supabase = await createSSRServerClient()
  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    console.error("[auth/callback] exchange failed:", error.message)
    return safeRedirect(buildRedirectUrl(request, "/criar?login=1"))
  }

  return safeRedirect(buildRedirectUrl(request, next))
}

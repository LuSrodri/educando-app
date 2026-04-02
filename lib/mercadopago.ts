import { createServerClient } from "@/lib/supabase/server"
import { createHmac, timingSafeEqual } from "crypto"

export const PACKS = {
  "10": { amountCents: 1490, credits: 10, label: "10 atividades", amountBRL: 14.9 },
  "20": { amountCents: 2490, credits: 20, label: "20 atividades", amountBRL: 24.9 },
} as const

export type PackId = keyof typeof PACKS

export interface PixPaymentResult {
  externalRef: string
  mpPaymentId: number
  qrCode: string
  qrCodeBase64: string
  expiresAt: string
}

export async function createPixPayment(
  browserId: string,
  pack: PackId
): Promise<PixPaymentResult> {
  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN
  if (!accessToken) throw new Error("MERCADOPAGO_ACCESS_TOKEN not set")

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://educando.app"
  const packData = PACKS[pack]
  const externalRef = crypto.randomUUID()

  // PIX expires in 30 minutes
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString()

  const body = {
    transaction_amount: packData.amountBRL,
    payment_method_id: "pix",
    payer: { email: "comprador@educando.app" },
    external_reference: externalRef,
    description: `Educando.app — ${packData.label}`,
    notification_url: `${appUrl}/api/webhooks/mercadopago`,
    date_of_expiration: expiresAt,
  }

  const response = await fetch("https://api.mercadopago.com/v1/payments", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
      "X-Idempotency-Key": externalRef,
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const err = await response.text()
    console.error("MP API error:", err)
    throw new Error("Failed to create PIX payment")
  }

  const mpData = await response.json()
  const txData = mpData.point_of_interaction?.transaction_data
  const qrCode: string = txData?.qr_code ?? ""
  const qrCodeBase64: string = txData?.qr_code_base64 ?? ""
  const mpPaymentId: number = mpData.id

  // Persist to DB
  const supabase = createServerClient()
  await supabase.from("mercadopago_payments").insert({
    browser_id: browserId,
    mp_payment_id: mpPaymentId,
    mp_external_ref: externalRef,
    pack,
    amount_cents: packData.amountCents,
    credits_to_grant: packData.credits,
    status: "pending",
    qr_code: qrCode,
    qr_code_base64: qrCodeBase64,
    pix_expires_at: expiresAt,
  })

  return { externalRef, mpPaymentId, qrCode, qrCodeBase64, expiresAt }
}

export function validateWebhookSignature(
  headers: Headers,
  rawBody: string
): boolean {
  const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET
  if (!secret) {
    console.warn("MERCADOPAGO_WEBHOOK_SECRET not set — skipping signature validation")
    return true
  }

  const xSignature = headers.get("x-signature")
  const xRequestId = headers.get("x-request-id") ?? ""
  if (!xSignature) return false

  // Parse ts=...,v1=...
  const parts: Record<string, string> = {}
  for (const part of xSignature.split(",")) {
    const [k, v] = part.split("=")
    if (k && v) parts[k.trim()] = v.trim()
  }
  const ts = parts["ts"]
  const v1 = parts["v1"]
  if (!ts || !v1) return false

  // Extract payment ID from body
  let paymentId = ""
  try {
    const parsed = JSON.parse(rawBody)
    paymentId = String(parsed?.data?.id ?? "")
  } catch {
    return false
  }

  const message = `id:${paymentId};request-id:${xRequestId};ts:${ts}`
  const expected = createHmac("sha256", secret).update(message).digest("hex")

  try {
    return timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(v1, "hex"))
  } catch {
    return false
  }
}

export async function getPaymentStatus(
  externalRef: string
): Promise<{ status: string; balance: number } | null> {
  const supabase = createServerClient()
  const { data } = await supabase
    .from("mercadopago_payments")
    .select("status, credits_to_grant, browser_id")
    .eq("mp_external_ref", externalRef)
    .single()

  if (!data) return null

  let balance = 0
  if (data.status === "approved") {
    const { data: credits } = await supabase
      .from("paid_credits")
      .select("balance")
      .eq("browser_id", data.browser_id)
      .single()
    balance = credits?.balance ?? 0
  }

  return { status: data.status, balance }
}

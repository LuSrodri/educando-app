import { NextResponse, type NextRequest } from "next/server"
import { getPack } from "@/lib/credit-packs"
import { isCpfAcceptable, sanitizeCpf } from "@/lib/cpf"
import { getStripe } from "@/lib/stripe"
import { createServerClient as createSupabaseAdmin } from "@/lib/supabase/server"
import { getCurrentUser } from "@/lib/supabase/ssr-server"

const PIX_EXPIRES_AFTER_SECONDS = 30 * 60

interface CreateBody {
  packCode?: string
  fullName?: string
  cpf?: string
}

function badRequest(reason: string) {
  return NextResponse.json({ error: reason }, { status: 400 })
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser()
  if (!user || !user.email) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  }

  let body: CreateBody
  try {
    body = (await request.json()) as CreateBody
  } catch {
    return badRequest("invalid_json")
  }

  const pack = body.packCode ? getPack(body.packCode) : null
  if (!pack) return badRequest("invalid_pack")

  const fullName = (body.fullName ?? "").trim()
  if (fullName.length < 3 || fullName.length > 120) {
    return badRequest("invalid_name")
  }

  const cpfDigits = sanitizeCpf(body.cpf ?? "")
  if (!isCpfAcceptable(cpfDigits)) {
    return badRequest("invalid_cpf")
  }

  const stripe = getStripe()
  const admin = createSupabaseAdmin()

  let paymentIntent
  try {
    paymentIntent = await stripe.paymentIntents.create({
      amount: pack.amountBrlCents,
      currency: "brl",
      payment_method_types: ["pix"],
      payment_method_data: {
        type: "pix",
        billing_details: {
          name: fullName,
          email: user.email,
          // Pix em conta US exige tax_id (CPF/CNPJ) no billing_details.
          tax_id: cpfDigits,
        },
      },
      payment_method_options: {
        pix: {
          expires_after_seconds: PIX_EXPIRES_AFTER_SECONDS,
          // Absorvemos os 3.5% de IOF — cliente vê o preço cheio no banco.
          amount_includes_iof: "always",
        },
      },
      confirm: true,
      metadata: {
        user_id: user.id,
        pack_code: pack.code,
        credits_amount: pack.credits.toString(),
      },
      description: `educando.app — ${pack.label} (${pack.credits} créditos)`,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : "stripe_error"
    console.error("[pagamento/criar] stripe error:", message)
    return NextResponse.json({ error: "stripe_error", message }, { status: 502 })
  }

  const expiresAtIso = paymentIntent.next_action?.pix_display_qr_code?.expires_at
    ? new Date(paymentIntent.next_action.pix_display_qr_code.expires_at * 1000).toISOString()
    : new Date(Date.now() + PIX_EXPIRES_AFTER_SECONDS * 1000).toISOString()

  const { data: row, error: insertError } = await admin
    .from("payment_intents")
    .insert({
      user_id: user.id,
      stripe_payment_intent_id: paymentIntent.id,
      pack_code: pack.code,
      credits_amount: pack.credits,
      amount_brl_cents: pack.amountBrlCents,
      status: "pending",
      expires_at: expiresAtIso,
      metadata: {
        full_name: fullName,
        cpf: cpfDigits,
      },
    })
    .select("id")
    .single()

  if (insertError || !row) {
    console.error("[pagamento/criar] insert error:", insertError?.message)
    // Idealmente cancelar o PaymentIntent aqui, mas Pix não tem capture
    // manual; ele expira sozinho. Deixamos pra reconciliação via webhook.
    return NextResponse.json({ error: "db_error" }, { status: 500 })
  }

  return NextResponse.json({ paymentId: row.id })
}

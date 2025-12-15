import { NextRequest, NextResponse } from "next/server"
import { MercadoPagoConfig, Payment } from "mercadopago"

const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN || "",
})

export async function POST(request: NextRequest) {
  try {
    const { sessionId, amount, email } = await request.json()

    if (!sessionId || !amount || !email) {
      return NextResponse.json({ error: "Dados inválidos" }, { status: 400 })
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Email inválido" }, { status: 400 })
    }

    const payment = new Payment(client)

    const expirationDate = new Date()
    expirationDate.setMinutes(expirationDate.getMinutes() + 30)

    const body = {
      transaction_amount: amount,
      description: "Atividade Educando.app",
      payment_method_id: "pix",
      date_of_expiration: expirationDate.toISOString(),
      payer: {
        email: email,
      },
      metadata: {
        session_id: sessionId,
      },
    }

    const result = await payment.create({ body })

    if (!result.point_of_interaction?.transaction_data) {
      return NextResponse.json({ error: "Erro ao gerar PIX" }, { status: 500 })
    }

    return NextResponse.json({
      paymentId: result.id,
      qrCode: result.point_of_interaction.transaction_data.qr_code,
      qrCodeBase64: result.point_of_interaction.transaction_data.qr_code_base64,
      ticketUrl: result.point_of_interaction.transaction_data.ticket_url,
      expirationDate: expirationDate.toISOString(),
    })
  } catch (error) {
    console.error("Erro ao criar pagamento PIX:", error)
    return NextResponse.json({ error: "Erro ao processar pagamento" }, { status: 500 })
  }
}

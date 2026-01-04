import { NextRequest, NextResponse } from "next/server"
import { MercadoPagoConfig, Payment } from "mercadopago"
import { addExtraCredit } from "@/lib/credits"

const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN || "",
})

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const paymentId = searchParams.get("paymentId")
    const browserId = searchParams.get("browserId")

    if (!paymentId) {
      return NextResponse.json({ error: "ID de pagamento invalido" }, { status: 400 })
    }

    const payment = new Payment(client)
    const result = await payment.get({ id: paymentId })

    // If payment is approved and we have a browserId, add credit to Supabase
    if (result.status === "approved" && browserId) {
      try {
        await addExtraCredit(browserId)
      } catch (creditError) {
        console.error("Error adding credit to Supabase:", creditError)
        // Don't fail the request, the payment is still approved
      }
    }

    return NextResponse.json({
      status: result.status,
      statusDetail: result.status_detail,
    })
  } catch (error) {
    console.error("Erro ao verificar pagamento:", error)
    return NextResponse.json({ error: "Erro ao verificar pagamento" }, { status: 500 })
  }
}

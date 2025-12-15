import { MercadoPagoConfig, Payment } from "mercadopago"

const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN!,
})

export async function POST(req: Request) {
  const body = await req.json()

  if (body.type === "payment" && body.data?.id) {
    const payment = new Payment(client)
    const paymentData = await payment.get({ id: body.data.id })

    if (paymentData.status === "approved") {
      // Pagamento aprovado - o crédito será adicionado no cliente via URL de retorno
      console.log("[v0] Payment approved:", paymentData.id, paymentData.metadata)
    }
  }

  return Response.json({ received: true })
}

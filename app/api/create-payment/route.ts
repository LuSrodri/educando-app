import { MercadoPagoConfig, Preference } from "mercadopago"

const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN!,
})

export async function POST(req: Request) {
  const { sessionId, quantity = 1 } = await req.json()

  const preference = new Preference(client)

  const result = await preference.create({
    body: {
      items: [
        {
          id: "atividade-escolar",
          title: `Atividade Escolar - educando.app`,
          description: `${quantity} atividade(s) extra para gerar`,
          quantity: quantity,
          unit_price: 1.99,
          currency_id: "BRL",
        },
      ],
      payment_methods: {
        excluded_payment_types: [
          { id: "credit_card" },
          { id: "debit_card" },
          { id: "ticket" },
          { id: "atm" },
          { id: "prepaid_card" },
        ],
        default_payment_method_id: "pix",
      },
      metadata: {
        session_id: sessionId,
        quantity: quantity,
      },
      back_urls: {
        success: `${process.env.NEXT_PUBLIC_APP_URL || "https://educando.app"}/pagamento/sucesso`,
        failure: `${process.env.NEXT_PUBLIC_APP_URL || "https://educando.app"}/pagamento/falha`,
        pending: `${process.env.NEXT_PUBLIC_APP_URL || "https://educando.app"}/pagamento/pendente`,
      },
      auto_return: "approved",
      external_reference: `${sessionId}_${Date.now()}`,
      expires: true,
      expiration_date_from: new Date().toISOString(),
      expiration_date_to: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    },
  })

  return Response.json({
    preferenceId: result.id,
    initPoint: result.init_point,
  })
}

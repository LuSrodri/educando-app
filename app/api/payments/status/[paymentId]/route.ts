import { getPaymentStatus } from "@/lib/mercadopago"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ paymentId: string }> }
) {
  try {
    const { paymentId } = await params
    if (!paymentId || paymentId.length > 64) {
      return Response.json({ error: "ID inválido" }, { status: 400 })
    }

    const result = await getPaymentStatus(paymentId)

    if (!result) {
      return Response.json({ error: "Pagamento não encontrado" }, { status: 404 })
    }

    return Response.json(result)
  } catch (error) {
    console.error("Error fetching payment status:", error)
    return Response.json({ error: "Erro ao verificar pagamento" }, { status: 500 })
  }
}

import { createPixPayment, PACKS, type PackId } from "@/lib/mercadopago"
import { validateBrowserId, ValidationError } from "@/lib/validation"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const browserId = validateBrowserId(body?.browserId)
    const pack = body?.pack as PackId

    if (!pack || !PACKS[pack]) {
      return Response.json({ error: "Pacote inválido. Escolha '1', '10' ou '20'." }, { status: 400 })
    }

    const result = await createPixPayment(browserId, pack)

    return Response.json({
      externalRef: result.externalRef,
      qrCode: result.qrCode,
      qrCodeBase64: result.qrCodeBase64,
      expiresAt: result.expiresAt,
      pack,
      credits: PACKS[pack].credits,
      amountBRL: PACKS[pack].amountBRL,
    })
  } catch (error) {
    if (error instanceof ValidationError) {
      return Response.json({ error: error.message }, { status: 400 })
    }
    console.error("Error creating PIX payment:", error)
    return Response.json({ error: "Erro ao criar pagamento PIX. Tente novamente." }, { status: 500 })
  }
}

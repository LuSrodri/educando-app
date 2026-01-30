import { NextRequest, NextResponse } from "next/server"
import { MercadoPagoConfig, Payment } from "mercadopago"
import { addExtraCredits, getPackageById } from "@/lib/credits"

const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN || "",
})

// Track processed payments to avoid double-crediting
const processedPayments = new Set<string>()

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const paymentId = searchParams.get("paymentId")
    const browserId = searchParams.get("browserId")
    const packageId = searchParams.get("packageId")

    if (!paymentId) {
      return NextResponse.json({ error: "ID de pagamento inválido" }, { status: 400 })
    }

    const payment = new Payment(client)
    const result = await payment.get({ id: paymentId })

    // If payment is approved and we have a browserId, add credits to Supabase
    if (result.status === "approved" && browserId) {
      // Check if we already processed this payment
      const paymentKey = `${paymentId}-${browserId}`
      if (!processedPayments.has(paymentKey)) {
        try {
          // Get credits from metadata first, fallback to package lookup, default to 1
          let credits = 1

          // Try to get credits from payment metadata
          const metadataCredits = result.metadata?.credits
          if (metadataCredits && typeof metadataCredits === "number") {
            credits = metadataCredits
          } else if (packageId) {
            // Fallback to package lookup
            const pkg = getPackageById(packageId)
            if (pkg) {
              credits = pkg.credits
            }
          }

          await addExtraCredits(browserId, credits)
          processedPayments.add(paymentKey)

          // Clean up old entries after 1 hour to prevent memory leak
          setTimeout(() => {
            processedPayments.delete(paymentKey)
          }, 3600000)
        } catch (creditError) {
          console.error("Error adding credits to Supabase:", creditError)
          // Don't fail the request, the payment is still approved
        }
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

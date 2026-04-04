import { createServerClient } from "@/lib/supabase/server"
import { validateBrowserId, ValidationError } from "@/lib/validation"
import { getPaidBalance } from "@/lib/paid-credits"
import { FREE_FORTNIGHTLY_LIMIT } from "@/lib/credits"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const browserId = validateBrowserId(body?.browserId)

    const supabase = createServerClient()

    const { data, error } = await supabase
      .from("browsers")
      .upsert(
        {
          browser_id: browserId,
          last_seen_at: new Date().toISOString(),
        },
        {
          onConflict: "browser_id",
        }
      )
      .select()
      .single()

    if (error) {
      console.error("Error upserting browser:", error)
      return Response.json({ error: "Failed to register browser" }, { status: 500 })
    }

    return Response.json({ browser: data })
  } catch (error) {
    if (error instanceof ValidationError) {
      return Response.json({ error: error.message }, { status: 400 })
    }
    console.error("Error in browser API:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const browserId = validateBrowserId(url.searchParams.get("browserId"))

    const supabase = createServerClient()

    const { data: browser } = await supabase
      .from("browsers")
      .select("*")
      .eq("browser_id", browserId)
      .single()

    if (!browser) {
      return Response.json({ error: "Browser not found" }, { status: 404 })
    }

    const now = new Date()
    const year = now.getUTCFullYear()
    const month = String(now.getUTCMonth() + 1).padStart(2, "0")
    const day = now.getUTCDate()
    const period = `${year}-${month}-${day <= 15 ? "01" : "16"}`

    const { data: usageData } = await supabase
      .from("daily_usage")
      .select("count")
      .eq("browser_id", browserId)
      .eq("usage_date", period)
      .single()

    const fortnightlyUsage = usageData?.count || 0
    const paidBalance = await getPaidBalance(browserId)

    return Response.json({ browser, fortnightlyUsage, paidBalance, freeLimit: FREE_FORTNIGHTLY_LIMIT })
  } catch (error) {
    if (error instanceof ValidationError) {
      return Response.json({ error: error.message }, { status: 400 })
    }
    console.error("Error in browser API:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}

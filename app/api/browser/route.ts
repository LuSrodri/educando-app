import { createServerClient } from "@/lib/supabase/server"

export async function POST(req: Request) {
  try {
    const { browserId } = await req.json()

    if (!browserId) {
      return Response.json({ error: "Browser ID is required" }, { status: 400 })
    }

    const supabase = createServerClient()

    // Upsert browser record
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
    console.error("Error in browser API:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const browserId = url.searchParams.get("browserId")

    if (!browserId) {
      return Response.json({ error: "Browser ID is required" }, { status: 400 })
    }

    const supabase = createServerClient()

    // Get browser data with usage and credits
    const { data: browser } = await supabase
      .from("browsers")
      .select("*")
      .eq("browser_id", browserId)
      .single()

    if (!browser) {
      return Response.json({ error: "Browser not found" }, { status: 404 })
    }

    // Get today's usage
    const today = new Date().toISOString().split("T")[0]
    const { data: usage } = await supabase
      .from("daily_usage")
      .select("count")
      .eq("browser_id", browserId)
      .eq("usage_date", today)
      .single()

    // Get credits
    const { data: credits } = await supabase
      .from("credits")
      .select("count")
      .eq("browser_id", browserId)
      .single()

    return Response.json({
      browser,
      dailyUsage: usage?.count || 0,
      extraCredits: credits?.count || 0,
    })
  } catch (error) {
    console.error("Error in browser API:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}

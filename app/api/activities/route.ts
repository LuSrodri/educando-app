import { createServerClient } from "@/lib/supabase/server"

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const browserId = url.searchParams.get("browserId")
    const limit = parseInt(url.searchParams.get("limit") || "20")
    const offset = parseInt(url.searchParams.get("offset") || "0")
    const rootOnly = url.searchParams.get("rootOnly") === "true"

    if (!browserId) {
      return Response.json({ error: "Browser ID is required" }, { status: 400 })
    }

    const supabase = createServerClient()

    let query = supabase
      .from("activities")
      .select("*")
      .eq("browser_id", browserId)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)

    if (rootOnly) {
      query = query.is("parent_id", null)
    }

    const { data, error } = await query

    if (error) {
      console.error("Error fetching activities:", error)
      return Response.json({ error: "Failed to fetch activities" }, { status: 500 })
    }

    return Response.json({ activities: data || [] })
  } catch (error) {
    console.error("Error in activities API:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

const PAGE_SIZE = 12

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10))
    const limit = Math.min(parseInt(searchParams.get("limit") || String(PAGE_SIZE), 10), 100)
    const offset = (page - 1) * limit

    const supabase = createServerClient()

    const { data, error, count } = await supabase
      .from("activities")
      .select("*", { count: "exact" })
      .eq("is_paid", false)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error("Error fetching community activities:", error)
      return NextResponse.json({ error: "Failed to fetch activities" }, { status: 500 })
    }

    return NextResponse.json({ data: data || [], total: count ?? 0, page, limit })
  } catch (error) {
    console.error("Error in community API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

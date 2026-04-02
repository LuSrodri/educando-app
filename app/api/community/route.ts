import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const offset = parseInt(searchParams.get("offset") || "0", 10)
    const limit = Math.min(parseInt(searchParams.get("limit") || "50", 10), 100)

    const supabase = createServerClient()

    const { data, error } = await supabase
      .from("activities")
      .select("*")
      .eq("is_paid", false)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error("Error fetching community activities:", error)
      return NextResponse.json({ error: "Failed to fetch activities" }, { status: 500 })
    }

    return NextResponse.json(data || [])
  } catch (error) {
    console.error("Error in community API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

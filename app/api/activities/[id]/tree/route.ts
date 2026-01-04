import { createServerClient } from "@/lib/supabase/server"

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    if (!id) {
      return Response.json({ error: "Activity ID is required" }, { status: 400 })
    }

    const supabase = createServerClient()

    // First, get the activity to find its root_id
    const { data: activity } = await supabase
      .from("activities")
      .select("root_id")
      .eq("id", id)
      .single()

    if (!activity) {
      return Response.json({ error: "Activity not found" }, { status: 404 })
    }

    // Get all activities in the tree using root_id
    const rootId = activity.root_id || id
    const { data: activities, error } = await supabase
      .from("activities")
      .select("*")
      .eq("root_id", rootId)
      .order("version_number", { ascending: true })

    if (error) {
      console.error("Error fetching activity tree:", error)
      return Response.json({ error: "Failed to fetch activity tree" }, { status: 500 })
    }

    return Response.json({ activities: activities || [] })
  } catch (error) {
    console.error("Error in activity tree API:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}

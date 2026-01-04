import { createServerClient } from "@/lib/supabase/server"

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    if (!id) {
      return Response.json({ error: "Activity ID is required" }, { status: 400 })
    }

    const supabase = createServerClient()

    const { data: activity, error } = await supabase
      .from("activities")
      .select("*")
      .eq("id", id)
      .single()

    if (error || !activity) {
      return Response.json({ error: "Activity not found" }, { status: 404 })
    }

    // Get signed URL for image
    const { data: signedUrl } = await supabase.storage
      .from("activities")
      .createSignedUrl(activity.image_path, 3600)

    return Response.json({
      activity,
      imageUrl: signedUrl?.signedUrl || null,
    })
  } catch (error) {
    console.error("Error in activity API:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    if (!id) {
      return Response.json({ error: "Activity ID is required" }, { status: 400 })
    }

    const supabase = createServerClient()

    // Get activity to find image path
    const { data: activity } = await supabase
      .from("activities")
      .select("image_path")
      .eq("id", id)
      .single()

    if (activity?.image_path) {
      // Delete image from storage
      await supabase.storage.from("activities").remove([activity.image_path])
    }

    // Delete activity record
    const { error } = await supabase.from("activities").delete().eq("id", id)

    if (error) {
      console.error("Error deleting activity:", error)
      return Response.json({ error: "Failed to delete activity" }, { status: 500 })
    }

    return Response.json({ success: true })
  } catch (error) {
    console.error("Error in activity API:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}

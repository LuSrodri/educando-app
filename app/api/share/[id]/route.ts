import { createServerClient } from "@/lib/supabase/server"

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://educando.app"

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    if (!id) {
      return Response.json({ error: "Activity ID is required" }, { status: 400 })
    }

    const supabase = createServerClient()

    // Check if activity exists
    const { data: activity, error: fetchError } = await supabase
      .from("activities")
      .select("*")
      .eq("id", id)
      .single()

    if (fetchError || !activity) {
      return Response.json({ error: "Activity not found" }, { status: 404 })
    }

    // Mark as shared if not already
    if (!activity.shared_at) {
      const { error: updateError } = await supabase
        .from("activities")
        .update({ shared_at: new Date().toISOString() })
        .eq("id", id)

      if (updateError) {
        console.error("Error marking activity as shared:", updateError)
        return Response.json({ error: "Failed to share activity" }, { status: 500 })
      }
    }

    const shareUrl = `${BASE_URL}/atividade/${id}`

    return Response.json({
      shareUrl,
      activity: {
        ...activity,
        shared_at: activity.shared_at || new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error("Error in share API:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}

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

    // Only return data if activity is shared
    if (!activity.shared_at) {
      return Response.json({ error: "Activity is not shared" }, { status: 403 })
    }

    // Get signed URL for image (long expiration since it's shared)
    const { data: signedUrl } = await supabase.storage
      .from("activities")
      .createSignedUrl(activity.image_path, 3600) // 1 hour, will be proxied anyway

    return Response.json({
      activity,
      imageUrl: signedUrl?.signedUrl || null,
    })
  } catch (error) {
    console.error("Error in share API:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}

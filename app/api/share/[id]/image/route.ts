import { createServerClient } from "@/lib/supabase/server"

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    if (!id) {
      return new Response("Activity ID is required", { status: 400 })
    }

    const supabase = createServerClient()

    // Get activity
    const { data: activity, error } = await supabase
      .from("activities")
      .select("image_path, image_media_type, shared_at")
      .eq("id", id)
      .single()

    if (error || !activity) {
      return new Response("Activity not found", { status: 404 })
    }

    // Only serve image if activity is shared
    if (!activity.shared_at) {
      return new Response("Activity is not shared", { status: 403 })
    }

    // Download image from Supabase Storage
    const { data: imageData, error: downloadError } = await supabase.storage
      .from("activities")
      .download(activity.image_path)

    if (downloadError || !imageData) {
      console.error("Error downloading image:", downloadError)
      return new Response("Failed to fetch image", { status: 500 })
    }

    // Convert blob to array buffer
    const arrayBuffer = await imageData.arrayBuffer()

    // Return image with proper headers for social media crawlers
    return new Response(arrayBuffer, {
      status: 200,
      headers: {
        "Content-Type": activity.image_media_type || "image/png",
        "Cache-Control": "public, max-age=31536000, immutable",
        "Content-Length": arrayBuffer.byteLength.toString(),
      },
    })
  } catch (error) {
    console.error("Error in share image API:", error)
    return new Response("Internal server error", { status: 500 })
  }
}

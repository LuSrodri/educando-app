import { createServerClient } from "@/lib/supabase/server"

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    if (!id) {
      return new Response("Activity ID is required", { status: 400 })
    }

    const supabase = createServerClient()

    const { data: activity, error } = await supabase
      .from("activities")
      .select("image_path, image_media_type")
      .eq("id", id)
      .single()

    if (error || !activity) {
      return new Response("Activity not found", { status: 404 })
    }

    const { data: imageData, error: downloadError } = await supabase.storage
      .from("activities")
      .download(activity.image_path)

    if (downloadError || !imageData) {
      console.error("Error downloading image:", downloadError)
      return new Response("Failed to fetch image", { status: 500 })
    }

    const arrayBuffer = await imageData.arrayBuffer()

    return new Response(arrayBuffer, {
      status: 200,
      headers: {
        "Content-Type": activity.image_media_type || "image/png",
        "Cache-Control": "public, max-age=31536000, stale-while-revalidate",
        "Content-Length": arrayBuffer.byteLength.toString(),
      },
    })
  } catch (error) {
    console.error("Error in share image API:", error)
    return new Response("Internal server error", { status: 500 })
  }
}

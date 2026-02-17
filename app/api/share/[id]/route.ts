import { createServerClient } from "@/lib/supabase/server"

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://educando.app"

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    if (!id) {
      return Response.json({ error: "Activity ID is required" }, { status: 400 })
    }

    const supabase = createServerClient()

    const { data: activity, error: fetchError } = await supabase
      .from("activities")
      .select("*")
      .eq("id", id)
      .single()

    if (fetchError || !activity) {
      return Response.json({ error: "Activity not found" }, { status: 404 })
    }

    const shareUrl = `${BASE_URL}/atividade/${id}`

    return Response.json({
      shareUrl,
      activity,
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

    const { data: signedUrl } = await supabase.storage
      .from("activities")
      .createSignedUrl(activity.image_path, 3600)

    return Response.json({
      activity,
      imageUrl: signedUrl?.signedUrl || null,
    })
  } catch (error) {
    console.error("Error in share API:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}

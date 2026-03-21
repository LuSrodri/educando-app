import { createServerClient } from "@/lib/supabase/server"
import type { Activity, InsertTables } from "@/lib/supabase/types"

export async function createActivity(
  data: Omit<InsertTables<"activities">, "id" | "created_at">
): Promise<Activity> {
  const supabase = createServerClient()

  const { data: activity, error } = await supabase
    .from("activities")
    .insert(data)
    .select()
    .single()

  if (error) {
    console.error("Error creating activity:", error)
    throw new Error("Failed to create activity")
  }

  return activity
}

export async function getActivity(activityId: string): Promise<Activity | null> {
  const supabase = createServerClient()

  const { data } = await supabase
    .from("activities")
    .select("*")
    .eq("id", activityId)
    .single()

  return data
}

export async function getActivitiesByBrowser(
  browserId: string,
  limit = 50,
  offset = 0
): Promise<Activity[]> {
  const supabase = createServerClient()

  const { data } = await supabase
    .from("activities")
    .select("*")
    .eq("browser_id", browserId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1)

  return data || []
}

export async function getAllActivities(limit = 100, offset = 0): Promise<Activity[]> {
  const supabase = createServerClient()

  const { data } = await supabase
    .from("activities")
    .select("*")
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1)

  return data || []
}

export async function uploadActivityImage(
  browserId: string,
  activityId: string,
  imageBuffer: Buffer,
  mediaType: string
): Promise<string> {
  const supabase = createServerClient()

  const extension = mediaType.split("/")[1] || "png"
  const imagePath = `${browserId}/${activityId}/activity.${extension}`

  const { error } = await supabase.storage
    .from("activities")
    .upload(imagePath, imageBuffer, {
      contentType: mediaType,
      upsert: true,
    })

  if (error) {
    console.error("Error uploading image:", error)
    throw new Error("Failed to upload image")
  }

  return imagePath
}

export async function getActivityImageUrl(imagePath: string): Promise<string> {
  const supabase = createServerClient()

  const { data } = await supabase.storage
    .from("activities")
    .createSignedUrl(imagePath, 3600)

  return data?.signedUrl || ""
}

export async function getActivityBySlug(semanticSlug: string): Promise<Activity | null> {
  const supabase = createServerClient()

  // The DB column stores only the last 12 hex chars (last UUID block).
  // Extract them from the full semantic slug to do an exact eq lookup.
  const match = semanticSlug.match(/([0-9a-f]{12})$/i)
  if (!match) return null

  const { data } = await supabase
    .from("activities")
    .select("*")
    .eq("semantic_slug", match[1])
    .maybeSingle()

  return data ?? null
}

export async function getRandomActivities(excludeId: string, limit = 3): Promise<Activity[]> {
  const supabase = createServerClient()

  const { data } = await supabase
    .from("activities")
    .select("*")
    .neq("id", excludeId)
    .order("created_at", { ascending: false })
    .limit(30)

  if (!data || data.length === 0) return []

  // Shuffle and return `limit` items
  const shuffled = data.sort(() => Math.random() - 0.5)
  return shuffled.slice(0, limit)
}

export async function getActivityImageBuffer(imagePath: string): Promise<Blob | null> {
  const supabase = createServerClient()

  const { data, error } = await supabase.storage
    .from("activities")
    .download(imagePath)

  if (error) {
    console.error("Error downloading image:", error)
    return null
  }

  return data
}

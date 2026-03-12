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

export async function getActivityByIdSuffix(idSuffix: string): Promise<Activity | null> {
  const supabase = createServerClient()

  const { data } = await supabase
    .from("activities")
    .select("*")
    .filter("id::text", "like", `%${idSuffix}`)
    .maybeSingle()

  return data ?? null
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

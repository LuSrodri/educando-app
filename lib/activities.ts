import { createServerClient } from "@/lib/supabase/server"
import type { Activity, InsertTables } from "@/lib/supabase/types"

export async function createActivity(
  data: Omit<InsertTables<"activities">, "id" | "created_at" | "version_number" | "root_id">
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

export async function getRootActivities(
  browserId: string,
  limit = 50,
  offset = 0
): Promise<Activity[]> {
  const supabase = createServerClient()

  const { data } = await supabase
    .from("activities")
    .select("*")
    .eq("browser_id", browserId)
    .is("parent_id", null)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1)

  return data || []
}

export async function getActivityTree(rootId: string): Promise<Activity[]> {
  const supabase = createServerClient()

  const { data } = await supabase
    .from("activities")
    .select("*")
    .eq("root_id", rootId)
    .order("version_number", { ascending: true })

  return data || []
}

export async function getActivityVersionChain(activityId: string): Promise<Activity[]> {
  const supabase = createServerClient()

  // First, get the root_id of this activity
  const { data: activity } = await supabase
    .from("activities")
    .select("root_id")
    .eq("id", activityId)
    .single()

  if (!activity?.root_id) {
    return []
  }

  // Then get all activities in this chain
  return getActivityTree(activity.root_id)
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
    .createSignedUrl(imagePath, 3600) // 1 hour expiration

  return data?.signedUrl || ""
}

export async function deleteActivity(activityId: string): Promise<void> {
  const supabase = createServerClient()

  // Get activity to find image path
  const { data: activity } = await supabase
    .from("activities")
    .select("image_path")
    .eq("id", activityId)
    .single()

  if (activity?.image_path) {
    // Delete image from storage
    await supabase.storage.from("activities").remove([activity.image_path])
  }

  // Delete activity record
  const { error } = await supabase.from("activities").delete().eq("id", activityId)

  if (error) {
    console.error("Error deleting activity:", error)
    throw new Error("Failed to delete activity")
  }
}

export async function shareActivity(activityId: string): Promise<Activity> {
  const supabase = createServerClient()

  const { data: activity, error } = await supabase
    .from("activities")
    .update({ shared_at: new Date().toISOString() })
    .eq("id", activityId)
    .select()
    .single()

  if (error || !activity) {
    console.error("Error sharing activity:", error)
    throw new Error("Failed to share activity")
  }

  return activity
}

export async function getSharedActivity(activityId: string): Promise<Activity | null> {
  const supabase = createServerClient()

  const { data } = await supabase
    .from("activities")
    .select("*")
    .eq("id", activityId)
    .not("shared_at", "is", null)
    .single()

  return data
}

export async function getSharedActivities(limit = 100): Promise<Activity[]> {
  const supabase = createServerClient()

  const { data } = await supabase
    .from("activities")
    .select("*")
    .not("shared_at", "is", null)
    .order("shared_at", { ascending: false })
    .limit(limit)

  return data || []
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

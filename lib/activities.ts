import { createServerClient } from "@/lib/supabase/server"
import type { Activity, InsertTables } from "@/lib/supabase/types"

export async function createActivity(
  data: Omit<InsertTables<"activities">, "id" | "created_at">,
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
  const { data } = await supabase.from("activities").select("*").eq("id", activityId).single()
  return data
}

export async function getAllActivities(limit = 100, offset = 0): Promise<Activity[]> {
  const supabase = createServerClient()
  const { data } = await supabase
    .from("activities")
    .select("*")
    .not("title", "is", null)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1)
  return data || []
}

export async function uploadActivityImage(
  folder: string,
  activityId: string,
  imageBuffer: Buffer,
  mediaType: string,
): Promise<string> {
  const supabase = createServerClient()
  const extension = mediaType.split("/")[1] || "png"
  const imagePath = `${folder}/${activityId}/activity.${extension}`
  const { error } = await supabase.storage
    .from("activities")
    .upload(imagePath, imageBuffer, { contentType: mediaType, upsert: true })
  if (error) {
    console.error("Error uploading image:", error)
    throw new Error("Failed to upload image")
  }
  return imagePath
}

export async function getActivityImageUrl(imagePath: string): Promise<string> {
  const supabase = createServerClient()
  const { data } = await supabase.storage.from("activities").createSignedUrl(imagePath, 3600)
  return data?.signedUrl || ""
}

export async function getActivityBySlug(semanticSlug: string): Promise<Activity | null> {
  const supabase = createServerClient()
  const match = semanticSlug.match(/([0-9a-f]{12})$/i)
  if (!match) return null
  const { data, error } = await supabase.rpc("find_activity_by_id_suffix", {
    p_suffix: match[1].toLowerCase(),
  })
  if (error) {
    console.error("[activities] find_activity_by_id_suffix failed:", error.message)
    return null
  }
  const rows = (data ?? []) as Activity[]
  return rows[0] ?? null
}

export async function getRelatedActivities(
  activity: Activity,
  limit = 3,
): Promise<Activity[]> {
  const supabase = createServerClient()
  const collected: Activity[] = []
  const seen = new Set<string>([activity.id])

  const collect = (rows: Activity[] | null | undefined) => {
    for (const row of rows ?? []) {
      if (seen.has(row.id)) continue
      seen.add(row.id)
      collected.push(row)
      if (collected.length >= limit) return true
    }
    return false
  }

  // 1. Same theme — strongest signal of relatedness
  if (activity.theme) {
    const { data } = await supabase
      .from("activities")
      .select("*")
      .eq("theme", activity.theme)
      .neq("id", activity.id)
      .not("title", "is", null)
      .order("quality_score", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false })
      .limit(limit)
    if (collect(data)) return collected
  }

  // 2. BNCC code overlap
  if (activity.bncc_codes.length > 0) {
    const { data } = await supabase
      .from("activities")
      .select("*")
      .overlaps("bncc_codes", activity.bncc_codes)
      .neq("id", activity.id)
      .not("title", "is", null)
      .order("quality_score", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false })
      .limit(limit * 2)
    if (collect(data)) return collected
  }

  // 3. Fallback — newest activities so the section is never empty
  const { data } = await supabase
    .from("activities")
    .select("*")
    .neq("id", activity.id)
    .not("title", "is", null)
    .order("created_at", { ascending: false })
    .limit(limit * 2)
  collect(data)

  return collected
}

export async function getActivityImageBuffer(imagePath: string): Promise<Blob | null> {
  const supabase = createServerClient()
  const { data, error } = await supabase.storage.from("activities").download(imagePath)
  if (error) {
    console.error("Error downloading image:", error)
    return null
  }
  return data
}

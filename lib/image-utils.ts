const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!

export function getActivityImageUrl(imagePath: string): string {
  return `${SUPABASE_URL}/storage/v1/object/public/activities/${imagePath}`
}

export function getActivityThumbnailUrl(imagePath: string, width: number): string {
  return `${SUPABASE_URL}/storage/v1/render/image/public/activities/${imagePath}?width=${width}&quality=50&resize=contain`
}

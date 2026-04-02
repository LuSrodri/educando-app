import type { Activity } from "@/lib/supabase/types"
import { getActivityImageUrl } from "@/lib/image-utils"

const PINTEREST_API = "https://api.pinterest.com/v5"

export async function postPin(activity: Activity): Promise<void> {
  const accessToken = process.env.PINTEREST_ACCESS_TOKEN
  const boardId = process.env.PINTEREST_BOARD_ID

  if (!accessToken || !boardId) {
    console.warn("Pinterest credentials not configured — skipping auto-pin")
    return
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://educando.app"
  const imageUrl = getActivityImageUrl(activity.image_path)
  const title = activity.original_prompt.slice(0, 100)
  const description =
    (activity.improved_prompt ?? activity.original_prompt).slice(0, 480) +
    "\n\nGerado gratuitamente em educando.app"
  const link = activity.semantic_slug
    ? `${appUrl}/atividade/${activity.semantic_slug}`
    : appUrl

  const body = {
    board_id: boardId,
    title,
    description,
    link,
    media_source: {
      source_type: "image_url",
      url: imageUrl,
    },
  }

  try {
    const response = await fetch(`${PINTEREST_API}/pins`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const err = await response.text()
      console.error("Pinterest pin failed:", response.status, err)
    }
  } catch (err) {
    // Never block generation — log and continue
    console.error("Pinterest postPin error:", err)
  }
}

import { permanentRedirect } from "next/navigation"
import { getActivity, getActivityBySlug } from "@/lib/activities"
import { isUUID, generateMaterialSlug } from "@/lib/slug"

// Legacy route: all historic /atividade/<slug> links redirect to /material/<theme-slug>.
export default async function LegacyActivityRedirect({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  const { id, theme } = await (async () => {
    if (isUUID(slug)) {
      const activity = await getActivity(slug)
      return { id: slug, theme: activity?.theme ?? null }
    }
    const activity = await getActivityBySlug(slug)
    return { id: activity?.id ?? null, theme: activity?.theme ?? null }
  })()

  if (!id) permanentRedirect("/")
  permanentRedirect(`/material/${generateMaterialSlug(theme, id)}`)
}

import { ImageResponse } from "next/og"
import { getActivity, getActivityBySlug } from "@/lib/activities"
import { getActivityImageUrl } from "@/lib/image-utils"
import { isUUID } from "@/lib/slug"

export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  let title = "Material pedagógico"
  let theme = ""
  let bnccCodes: string[] = []
  let imageUrl: string | null = null

  try {
    const activity = isUUID(slug) ? await getActivity(slug) : await getActivityBySlug(slug)
    if (activity && activity.user_id == null) {
      title = activity.title ?? "Material pedagógico"
      theme = activity.theme ?? ""
      bnccCodes = (activity.bncc_codes ?? []).slice(0, 4)
      imageUrl = getActivityImageUrl(activity.image_path)
    }
  } catch {
    // use defaults on any error
  }

  const shortTitle = title.length > 75 ? `${title.slice(0, 75)}…` : title

  return new ImageResponse(
    <div
      style={{
        width: 1200,
        height: 630,
        display: "flex",
        background: "white",
        fontFamily: "sans-serif",
      }}
    >
      {imageUrl && (
        <div
          style={{
            width: 360,
            height: 630,
            overflow: "hidden",
            flexShrink: 0,
            background: "#f9fafb",
            display: "flex",
          }}
        >
          <img
            src={imageUrl}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              objectPosition: "top center",
            }}
          />
        </div>
      )}

      <div
        style={{
          flex: 1,
          padding: "52px 52px 48px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "linear-gradient(145deg, #fffbeb 0%, #ffffff 100%)",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column" }}>
          {theme && (
            <div
              style={{
                color: "#d97706",
                fontSize: 16,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                marginBottom: 20,
                display: "flex",
              }}
            >
              {theme}
            </div>
          )}
          <div
            style={{
              fontSize: 40,
              fontWeight: 900,
              color: "#111827",
              lineHeight: 1.2,
              letterSpacing: "-0.02em",
              display: "flex",
            }}
          >
            {shortTitle}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {bnccCodes.length > 0 && (
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {bnccCodes.map((code) => (
                <span
                  key={code}
                  style={{
                    background: "#fef3c7",
                    color: "#92400e",
                    padding: "5px 14px",
                    borderRadius: 100,
                    fontSize: 14,
                    fontWeight: 700,
                    border: "1px solid #fde68a",
                    display: "flex",
                  }}
                >
                  {code}
                </span>
              ))}
            </div>
          )}

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 38,
                height: 38,
                background: "#f59e0b",
                borderRadius: 9,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span style={{ color: "white", fontWeight: 900, fontSize: 18 }}>e</span>
            </div>
            <span style={{ color: "#374151", fontWeight: 700, fontSize: 18 }}>educando.app</span>
          </div>
        </div>
      </div>
    </div>,
    size,
  )
}

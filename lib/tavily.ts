// Minimal Tavily Search client. Used to pull external image candidates when the
// internal directory has fewer than N results for a query.

const TAVILY_URL = "https://api.tavily.com/search"

export interface TavilyImage {
  url: string
  description?: string
}

export interface TavilyResult {
  title?: string
  url?: string
  content?: string
  images?: TavilyImage[]
}

export interface TavilySearchResponse {
  query: string
  images: TavilyImage[]
  results: TavilyResult[]
}

export async function tavilySearchImages(
  query: string,
  options: { maxResults?: number } = {},
): Promise<TavilySearchResponse> {
  const apiKey = process.env.TAVILY_API_KEY
  if (!apiKey) throw new Error("TAVILY_API_KEY missing")

  const body = {
    query,
    include_images: true,
    include_image_descriptions: true,
    max_results: Math.min(Math.max(options.maxResults ?? 10, 1), 20),
    search_depth: "basic" as const,
    topic: "general" as const,
    country: "brazil" as const,
  }

  const controller = new AbortController()
  const t = setTimeout(() => controller.abort(), 20_000)
  try {
    const res = await fetch(TAVILY_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    })
    if (!res.ok) {
      const text = await res.text().catch(() => "")
      throw new Error(`tavily_${res.status}: ${text.slice(0, 200)}`)
    }
    return (await res.json()) as TavilySearchResponse
  } finally {
    clearTimeout(t)
  }
}

/**
 * Dedupe and flatten images from both the top-level `images` list and each
 * result's nested `images` array. Skips empty URLs.
 */
export function collectImageCandidates(response: TavilySearchResponse): TavilyImage[] {
  const seen = new Set<string>()
  const out: TavilyImage[] = []
  const push = (img?: TavilyImage) => {
    if (!img?.url) return
    if (seen.has(img.url)) return
    seen.add(img.url)
    out.push(img)
  }
  for (const img of response.images ?? []) push(img)
  for (const r of response.results ?? []) {
    for (const img of r.images ?? []) push(img)
  }
  return out
}

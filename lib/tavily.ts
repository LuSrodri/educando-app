// Minimal Tavily Search client. Used to ground spec generation in real
// Brazilian pedagogical sources (BNCC, Nova Escola, MEC, etc.).

const TAVILY_URL = "https://api.tavily.com/search"

export interface TavilyResult {
  title?: string
  url?: string
  content?: string
}

export interface TavilySearchResponse {
  query: string
  answer?: string
  results: TavilyResult[]
  request_id?: string
}

export interface TavilySearchOptions {
  maxResults?: number
  includeAnswer?: boolean
  includeDomains?: string[]
  searchDepth?: "basic" | "fast" | "ultra-fast" | "advanced"
}

export class TavilyError extends Error {
  status: number
  requestId?: string
  constructor(message: string, status: number, requestId?: string) {
    super(message)
    this.name = "TavilyError"
    this.status = status
    this.requestId = requestId
  }
}

export async function tavilySearch(
  query: string,
  options: TavilySearchOptions = {},
): Promise<TavilySearchResponse> {
  const apiKey = process.env.TAVILY_API_KEY
  if (!apiKey) throw new Error("TAVILY_API_KEY missing")

  const searchDepth = options.searchDepth ?? "fast"
  const body: Record<string, unknown> = {
    query,
    max_results: Math.min(Math.max(options.maxResults ?? 5, 1), 20),
    search_depth: searchDepth,
    topic: "general",
    include_answer: options.includeAnswer ? "basic" : false,
  }
  // `country` is rejected by Tavily on fast/ultra-fast depths. BR scoping is
  // already handled by `include_domains` upstream, so we only set country on
  // basic/advanced where it's accepted.
  if (searchDepth === "basic" || searchDepth === "advanced") {
    body.country = "brazil"
  }
  if (options.includeDomains && options.includeDomains.length > 0) {
    body.include_domains = options.includeDomains
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
      let requestId: string | undefined
      try {
        requestId = JSON.parse(text)?.request_id
      } catch {
        // body wasn't JSON
      }
      throw new TavilyError(
        `tavily_${res.status}: ${text.slice(0, 200)}`,
        res.status,
        requestId,
      )
    }
    return (await res.json()) as TavilySearchResponse
  } finally {
    clearTimeout(t)
  }
}

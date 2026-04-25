import { NextResponse } from "next/server"
import OpenAI from "openai"
import { createServerClient } from "@/lib/supabase/server"
import { tavilySearchImages, type TavilySearchResponse } from "@/lib/tavily"
import { randomUUID } from "node:crypto"

export const maxDuration = 500
export const dynamic = "force-dynamic"

const MAX_TOPICS = 3
const MIN_COVERAGE_THRESHOLD = 2

// ─── Design system injected into every image prompt ───────────────────────────

const DESIGN_SYSTEM = `
DESIGN SYSTEM — EDUCATIONAL WORKSHEET (A4 portrait, print-ready, 300 DPI):

HEADER (include only for type "activity" — omit entirely for support materials):
Full-width thin-bordered rectangle at the very top of the page. Two rows of fill-in fields inside:
  Row 1: "Nome: _________________________________    Escola: _________________________________"
  Row 2: "Professor(a): ______________________    Turma: ________    Ano: ________    Data: ____/____/______"
Generous underlines for handwriting. Thin border, no color fill. Black text only.

TYPOGRAPHY: Clean neutral sans-serif throughout — Helvetica or Arial style. No rounded letterforms, no playful or display fonts, no serifs. Title: 14–16pt bold. Body/instructions: 11pt. Labels/captions: 9–10pt. Minimum 8pt anywhere.

COLOR RULE: Illustrations and content figures are FULL COLOR, vibrant and age-appropriate. All structural elements — borders, rules, boxes, text, instruction lines, header, footer — are strictly black, dark gray, or white. No color anywhere in the layout structure.

SPACING: 1.5 cm margins on all sides. Clear breathing room between each section. No crowding or clutter.

FOOTER: Bottom of page, left-aligned, 8–9pt sans-serif: "BNCC: [codes here]"

CULTURAL CONTEXT: Use Brazilian names (Kauan, Ana Júlia, Beatriz, João Pedro, Yasmin, Miguel), Brazilian geography and biomes (Cerrado, Amazônia, Caatinga, Sertão, Sul), Brazilian fauna and flora (tucano, onça-pintada, açaí, jacarandá, sabiá-laranjeira, capivara, arara), and multicultural everyday Brazilian life.

AVOID: watermarks, logos, religious imagery, politically sensitive content, borders thicker than 2pt, font sizes below 8pt.
`.trim()

// ─── Types ────────────────────────────────────────────────────────────────────

interface ActivitySpec {
  title: string
  theme: string
  short_description: string
  long_description: string
  bncc_codes: string[]
  type: "activity" | "support_material"
  image_prompt: string
}

interface TopicResult {
  query: string
  id?: string
  error?: string
}

// ─── External research helpers ────────────────────────────────────────────────

async function searchTavily(query: string): Promise<{ summary: string; urls: string[] }> {
  try {
    const response: TavilySearchResponse = await tavilySearchImages(
      `atividade pedagógica "${query}" BNCC ensino fundamental Brasil cultura brasileira`,
      { maxResults: 5 }
    )
    const snippets = (response.results ?? [])
      .map((r) => `[${r.title ?? ""}]\n${r.content ?? ""}`)
      .join("\n\n")
    const urls = (response.results ?? [])
      .map((r) => r.url)
      .filter((u): u is string => typeof u === "string" && u.length > 0)
    return { summary: snippets, urls }
  } catch (err) {
    console.error("[weekly-activities] tavily failed:", (err as Error).message)
    return { summary: "", urls: [] }
  }
}

async function scrapeWithFirecrawl(url: string, apiKey: string): Promise<string> {
  try {
    const res = await fetch("https://api.firecrawl.dev/v2/scrape", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        url,
        formats: ["markdown"],
        onlyMainContent: true,
        timeout: 30000,
      }),
    })
    if (!res.ok) return ""
    const data = await res.json()
    return (data.data?.markdown ?? "").slice(0, 3000)
  } catch (err) {
    console.error("[weekly-activities] firecrawl failed:", (err as Error).message)
    return ""
  }
}

// ─── Spec generation ──────────────────────────────────────────────────────────

const SPEC_JSON_SCHEMA = {
  name: "activity_spec",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      title: { type: "string", minLength: 5, maxLength: 80 },
      theme: { type: "string", minLength: 5, maxLength: 120 },
      short_description: { type: "string", minLength: 10, maxLength: 200 },
      long_description: { type: "string", minLength: 30, maxLength: 600 },
      bncc_codes: {
        type: "array",
        items: { type: "string" },
        minItems: 1,
        maxItems: 5,
      },
      type: { type: "string", enum: ["activity", "support_material"] },
      image_prompt: { type: "string", minLength: 200 },
    },
    required: [
      "title",
      "theme",
      "short_description",
      "long_description",
      "bncc_codes",
      "type",
      "image_prompt",
    ],
  },
} as const

async function generateSpec(
  query: string,
  tavilySummary: string,
  firecrawlContent: string,
  openai: OpenAI
): Promise<ActivitySpec> {
  const systemPrompt = [
    "Você é um especialista em pedagogia brasileira e na Base Nacional Comum Curricular (BNCC).",
    "Gere fichas escolares impressas de alta qualidade, alinhadas ao currículo e à cultura brasileira.",
    "Use códigos BNCC reais e válidos no formato EF__XX__ (ex.: EF03LP04, EF02MA17, EI03ET06).",
  ].join("\n")

  const userPrompt = `Com base na pesquisa abaixo, gere a especificação de UMA atividade educacional impressa sobre o tema: "${query}".

PESQUISA (Tavily):
${tavilySummary || "(sem resultados)"}

REFERÊNCIA TÉCNICA (Firecrawl):
${firecrawlContent || "(sem conteúdo)"}

PARA O image_prompt, aplique este sistema de design:
${DESIGN_SYSTEM}

O prompt de imagem (em inglês) deve especificar com precisão:
- O cabeçalho completo (nome, escola, turma, professor(a), ano, data) — ou omitir se type="support_material"
- Cada seção do corpo com instruções em português e espaços para o aluno preencher
- Ilustrações coloridas com elementos da cultura brasileira (nomes, biomas, fauna, flora)
- O rodapé com os códigos BNCC reais
- Tipografia, espaçamento e estrutura visual conforme o sistema de design.`

  const completion = await openai.chat.completions.create({
    model: "gpt-5.4-nano",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    response_format: { type: "json_schema", json_schema: SPEC_JSON_SCHEMA },
  })

  const raw = completion.choices[0]?.message?.content
  if (!raw) throw new Error("spec_generation_empty")

  return JSON.parse(raw) as ActivitySpec
}

// ─── Image generation ─────────────────────────────────────────────────────────

async function generateImage(prompt: string, openai: OpenAI): Promise<Buffer> {
  const result = await openai.images.generate({
    model: "gpt-image-2",
    prompt,
    size: "1024x1536",
    quality: "high",
    output_format: "png",
    background: "opaque",
    n: 1,
  })
  const b64 = result.data?.[0]?.b64_json
  if (!b64) throw new Error("openai_image_empty_output")
  return Buffer.from(b64, "base64")
}

// ─── Per-topic pipeline ───────────────────────────────────────────────────────

async function processTopic(
  query: string,
  openai: OpenAI,
  supabase: ReturnType<typeof createServerClient>,
  firecrawlKey: string
): Promise<TopicResult> {
  try {
    // Skip if already have sufficient coverage (idempotency for duplicate cron events).
    // We escape SQL LIKE wildcards. We do NOT use .or() because its filter syntax
    // separates conditions with commas — a comma in the query value would break it.
    const sanitized = query.replace(/[%_\\]/g, "\\$&")
    const { count } = await supabase
      .from("activities")
      .select("id", { count: "exact", head: true })
      .ilike("theme", `%${sanitized}%`)

    if ((count ?? 0) >= MIN_COVERAGE_THRESHOLD) {
      return { query, error: "skip_sufficient_coverage" }
    }

    // Research: Tavily for textual + visual references
    const tavilyResult = await searchTavily(query)

    // Firecrawl for technical grounding — scrape the most pedagogical URL
    let firecrawlContent = ""
    if (firecrawlKey && tavilyResult.urls.length > 0) {
      const educationalUrl =
        tavilyResult.urls.find((u) =>
          /nova-escola|mec\.gov|qedu|gestaoescolar|bncc|escolakids|brasilescola/.test(u)
        ) ?? tavilyResult.urls[0]
      firecrawlContent = await scrapeWithFirecrawl(educationalUrl, firecrawlKey)
    }

    // Generate activity spec
    const spec = await generateSpec(query, tavilyResult.summary, firecrawlContent, openai)

    // Generate worksheet image
    const imageBuffer = await generateImage(spec.image_prompt, openai)

    // Upload to Supabase Storage
    const activityId = randomUUID()
    const imagePath = `internal/${activityId}/activity.png`

    const { error: uploadError } = await supabase.storage
      .from("activities")
      .upload(imagePath, imageBuffer, { contentType: "image/png", upsert: true })
    if (uploadError) throw new Error(`upload_failed: ${uploadError.message}`)

    // Insert activity record
    const { data: row, error: insertError } = await supabase
      .from("activities")
      .insert({
        id: activityId,
        image_path: imagePath,
        image_media_type: "image/png",
        title: spec.title,
        theme: spec.theme,
        short_description: spec.short_description,
        long_description: spec.long_description,
        bncc_codes: spec.bncc_codes,
        type: spec.type,
        source_url: null,
        source_provider: "internal",
        quality_score: 0.9,
      })
      .select("id")
      .single()
    if (insertError) throw new Error(`insert_failed: ${insertError.message}`)

    console.log(`[weekly-activities] ✓ "${spec.title}" → ${row?.id}`)
    return { query, id: row?.id }
  } catch (err) {
    const message = (err as Error).message
    console.error(`[weekly-activities] ✗ "${query}" — ${message}`)
    return { query, error: message }
  }
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function GET(req: Request) {
  // Verify Vercel cron secret
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && req.headers.get("authorization") !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  }

  const openaiKey = process.env.OPENAI_API_KEY!
  const tavilyKey = process.env.TAVILY_API_KEY!
  const firecrawlKey = process.env.FIRECRAWL_API_KEY ?? ""

  if (!openaiKey || !tavilyKey) {
    return NextResponse.json({ error: "missing_env_vars" }, { status: 500 })
  }

  const openai = new OpenAI({ apiKey: openaiKey })
  const supabase = createServerClient()

  // Fetch top under-served search queries from the past 7 days
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const { data: rows, error: queryError } = await supabase
    .from("search_queries")
    .select("normalized_query")
    .eq("outcome", "ok")
    .lt("results_count", 5)
    .gte("created_at", since)
    .not("normalized_query", "is", null)

  if (queryError) {
    return NextResponse.json({ error: `db_query_failed: ${queryError.message}` }, { status: 500 })
  }

  if (!rows?.length) {
    return NextResponse.json({ message: "no_under_served_searches", generated: 0 })
  }

  // Rank by frequency
  const freq = new Map<string, number>()
  for (const { normalized_query } of rows) {
    if (normalized_query && normalized_query.length > 3) {
      freq.set(normalized_query, (freq.get(normalized_query) ?? 0) + 1)
    }
  }
  const topTerms = [...freq.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, MAX_TOPICS)
    .map(([q]) => q)

  console.log(`[weekly-activities] Processing ${topTerms.length} topics:`, topTerms)

  // Process all topics in parallel
  const results = await Promise.all(
    topTerms.map((query) => processTopic(query, openai, supabase, firecrawlKey))
  )

  const generated = results.filter((r) => r.id)
  const failed = results.filter((r) => r.error && r.error !== "skip_sufficient_coverage")
  const skipped = results.filter((r) => r.error === "skip_sufficient_coverage")

  return NextResponse.json({
    generated: generated.length,
    failed: failed.length,
    skipped: skipped.length,
    results,
  })
}

// Expands a teacher's search into a small set of PT-BR phrasings so we can
// hit Tavily with broader coverage when the internal directory comes up short.

import OpenAI from "openai"

const MODEL = "gpt-5.4-nano"
const MAX_VARIANTS = 2

const SYSTEM_PROMPT = [
  "Você reformula buscas de professores brasileiros por atividades e materiais pedagógicos.",
  `Dada uma busca original em PT-BR, gere ${MAX_VARIANTS} reformulações alternativas que um professor brasileiro também usaria para o mesmo tópico pedagógico.`,
  "Regras:",
  "- Mantenha a mesma intenção e faixa etária implícita.",
  "- Varie sinônimos, nível de formalidade e palavras-chave (ex.: 'atividade', 'exercício', 'folha', 'para imprimir', 'PDF').",
  "- Não repita a busca original.",
  "- Cada variação: 3 a 80 caracteres, sem aspas.",
].join("\n")

const JSON_SCHEMA = {
  name: "query_variants",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      variants: {
        type: "array",
        items: { type: "string" },
        minItems: MAX_VARIANTS,
        maxItems: MAX_VARIANTS,
      },
    },
    required: ["variants"],
  },
} as const

export async function expandQuery(original: string): Promise<string[]> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) return [original]

  const openai = new OpenAI({ apiKey })

  try {
    const resp = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: `Busca original: ${original}` },
      ],
      response_format: { type: "json_schema", json_schema: JSON_SCHEMA },
    })

    const raw = resp.choices?.[0]?.message?.content
    if (!raw) return [original]

    const parsed = JSON.parse(raw) as { variants: string[] }
    const variants = (parsed.variants ?? [])
      .map((v) => v.trim())
      .filter((v) => v.length > 0 && v.toLowerCase() !== original.toLowerCase())

    const seen = new Set<string>()
    const out: string[] = []
    for (const q of [original, ...variants]) {
      const key = q.toLowerCase()
      if (seen.has(key)) continue
      seen.add(key)
      out.push(q)
    }
    return out
  } catch (err) {
    console.error("[query-expansion] failed:", (err as Error).message)
    return [original]
  }
}

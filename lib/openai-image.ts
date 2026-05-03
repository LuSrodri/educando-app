// Pós-processamento de candidatos Tavily com gpt-image-2.
// Transforma a imagem externa em uma folha A4 limpa e autossuficiente,
// removendo marcas d'água, propagandas, links e logos. Retorna o buffer
// pronto para subir no Supabase Storage.

import OpenAI, { toFile } from "openai"

const MODEL = "gpt-image-2"

const PROMPT =
  "Transforme isso em um arquivo de atividade/material de apoio, pronto para ser impresso. Alta qualidade. Fundo branco. Espaços e margens otimizadas. Remova qualquer marcas d'águas, propagandas, links, logos, ou outros elementos dissociativos. Seja extremamente fiel ao material original."

// images.edit aceita apenas png/webp/jpg (<50MB) para os modelos gpt-image-*.
const SUPPORTED_CONTENT_TYPES: ReadonlySet<string> = new Set([
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
])

const REJECTED_EXTENSIONS: ReadonlySet<string> = new Set([
  ".gif",
  ".svg",
  ".bmp",
  ".tif",
  ".tiff",
  ".heic",
  ".heif",
  ".avif",
  ".ico",
  ".pdf",
])

const ACCEPTED_EXTENSIONS: ReadonlySet<string> = new Set([
  ".png",
  ".jpg",
  ".jpeg",
  ".webp",
])

/**
 * Filtro barato por extensão da URL, aplicado na coleta de candidatos Tavily
 * para evitar gastar classificador em imagens que `images.edit` rejeitaria.
 * URLs sem extensão passam — cabe ao runtime (`fetchSource`) checar o
 * content-type real do servidor.
 */
export function isEditableImageUrl(rawUrl: string): boolean {
  let pathname: string
  try {
    pathname = new URL(rawUrl).pathname.toLowerCase()
  } catch {
    return false
  }
  const dot = pathname.lastIndexOf(".")
  if (dot < 0) return true
  const ext = pathname.slice(dot)
  if (ACCEPTED_EXTENSIONS.has(ext)) return true
  if (REJECTED_EXTENSIONS.has(ext)) return false
  return true
}

// Regex for private/loopback address spaces — blocks SSRF to internal hosts.
const PRIVATE_HOST_RE =
  /^(localhost|127\.\d+\.\d+\.\d+|0\.0\.0\.0|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+|192\.168\.\d+\.\d+|169\.254\.\d+\.\d+|::1|fc[0-9a-f]{2}:|fd[0-9a-f]{2}:)/i

function assertSafeUrl(rawUrl: string): void {
  let parsed: URL
  try {
    parsed = new URL(rawUrl)
  } catch {
    throw new Error("invalid_url")
  }
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    throw new Error("blocked_protocol")
  }
  if (PRIVATE_HOST_RE.test(parsed.hostname)) {
    throw new Error("blocked_private_host")
  }
}

async function fetchSource(url: string): Promise<{ buffer: Buffer; contentType: string; filename: string }> {
  assertSafeUrl(url)
  const controller = new AbortController()
  const t = setTimeout(() => controller.abort(), 25_000)
  try {
    const res = await fetch(url, { signal: controller.signal, redirect: "manual" })
    if (res.status >= 300 && res.status < 400) throw new Error("blocked_redirect")
    if (!res.ok) throw new Error(`download_${res.status}`)
    const contentType = (res.headers.get("content-type") ?? "image/png").split(";")[0].trim().toLowerCase()
    if (!SUPPORTED_CONTENT_TYPES.has(contentType)) {
      throw new Error(`unsupported_content_type:${contentType}`)
    }
    const normalizedType = contentType === "image/jpg" ? "image/jpeg" : contentType
    const extension = normalizedType.split("/")[1] || "png"
    const buffer = Buffer.from(await res.arrayBuffer())
    return { buffer, contentType: normalizedType, filename: `source.${extension}` }
  } finally {
    clearTimeout(t)
  }
}

/**
 * Limpa uma imagem candidata via gpt-image-2 (images.edit).
 * Retorna diretamente o buffer PNG gerado pela OpenAI.
 */
export async function openaiCleanImage(
  sourceUrl: string,
): Promise<{ buffer: Buffer; contentType: string }> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error("OPENAI_API_KEY missing")

  const openai = new OpenAI({ apiKey })
  const { buffer, contentType, filename } = await fetchSource(sourceUrl)

  const result = await openai.images.edit({
    model: MODEL,
    image: await toFile(buffer, filename, { type: contentType }),
    prompt: PROMPT,
    input_fidelity: "high",
    quality: "high",
    size: "1024x1536",
    output_format: "png",
    background: "opaque",
  })

  const b64 = result.data?.[0]?.b64_json
  if (!b64) throw new Error("openai_image_empty_output")

  return { buffer: Buffer.from(b64, "base64"), contentType: "image/png" }
}

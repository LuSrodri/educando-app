// Replicate client focused on running qwen/qwen-image-2-pro to clean up
// external image candidates (watermarks, URLs, logos, artefacts) before we
// ingest them into the directory.

const REPLICATE_URL = "https://api.replicate.com/v1"
const MODEL_OWNER = "qwen"
const MODEL_NAME = "qwen-image-2-pro"
const WAIT_SECONDS = 60

interface Prediction {
  id: string
  status: "starting" | "processing" | "succeeded" | "failed" | "canceled"
  output?: string | string[]
  error?: string | null
  urls?: { get?: string }
}

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function waitForCompletion(pollUrl: string, token: string): Promise<Prediction> {
  const deadline = Date.now() + 120_000
  while (Date.now() < deadline) {
    await sleep(2500)
    const res = await fetch(pollUrl, { headers: { Authorization: `Bearer ${token}` } })
    if (!res.ok) throw new Error(`replicate_poll_${res.status}`)
    const pred = (await res.json()) as Prediction
    if (pred.status === "succeeded" || pred.status === "failed" || pred.status === "canceled") {
      return pred
    }
  }
  throw new Error("replicate_poll_timeout")
}

/**
 * Cleans up a source image via qwen/qwen-image-2-pro.
 * Returns the URL of the cleaned image.
 */
export async function replicateCleanImage(sourceUrl: string): Promise<string> {
  const token = process.env.REPLICATE_API_TOKEN
  if (!token) throw new Error("REPLICATE_API_TOKEN missing")

  const body = {
    input: {
      image: sourceUrl,
      prompt:
        "Remova todas as marcas d'água, logos, URLs, textos sobrepostos, bordas distorcidas e elementos destoantes. Preserve integralmente o conteúdo pedagógico, mantendo a legibilidade e a composição original. Resultado em alta resolução, limpo, pronto para impressão A4.",
      negative_prompt:
        "watermark, logo, website url, text overlay, extra caption, distortion, blur, artifacts, low quality",
      match_input_image: true,
      enable_prompt_expansion: false,
    },
  }

  const res = await fetch(
    `${REPLICATE_URL}/models/${MODEL_OWNER}/${MODEL_NAME}/predictions`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Prefer: `wait=${WAIT_SECONDS}`,
      },
      body: JSON.stringify(body),
    },
  )

  if (!res.ok) {
    const text = await res.text().catch(() => "")
    throw new Error(`replicate_${res.status}: ${text.slice(0, 200)}`)
  }

  let pred = (await res.json()) as Prediction
  if (pred.status !== "succeeded" && pred.status !== "failed" && pred.status !== "canceled") {
    const pollUrl = pred.urls?.get
    if (!pollUrl) throw new Error("replicate_missing_poll_url")
    pred = await waitForCompletion(pollUrl, token)
  }

  if (pred.status !== "succeeded") {
    throw new Error(`replicate_${pred.status}: ${pred.error ?? "unknown"}`)
  }

  const output = Array.isArray(pred.output) ? pred.output[0] : pred.output
  if (!output) throw new Error("replicate_empty_output")
  return output
}

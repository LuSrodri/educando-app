import { type NextRequest } from "next/server"
import OpenAI from "openai"
import { randomUUID } from "node:crypto"
import { getCurrentUser } from "@/lib/supabase/ssr-server"
import { createServerClient as createSupabaseAdmin } from "@/lib/supabase/server"
import { generateSpec, generateImage } from "@/lib/generation"
import { generateMaterialSlug } from "@/lib/slug"

export const dynamic = "force-dynamic"
export const maxDuration = 600

type ActivityType = "activity" | "support_material"

type SseStage =
  | { stage: "generating_spec" }
  | { stage: "generating_image" }
  | { stage: "saving" }
  | { stage: "done"; activityId: string; slug: string }
  | { stage: "error"; message: string; code?: string }

const encoder = new TextEncoder()
const KEEPALIVE_CHUNK = encoder.encode(": keepalive\n\n")

function sseChunk(data: SseStage): Uint8Array {
  return encoder.encode(`data: ${JSON.stringify(data)}\n\n`)
}

// SSE comment frames (": ...\n\n") are discarded by EventSource/readers but
// keep the underlying TCP connection from looking idle to NAT/proxies, which
// would otherwise drop it during long awaits (image generation can take 60s+).
async function withKeepalive<T>(
  controller: ReadableStreamDefaultController<Uint8Array>,
  promise: Promise<T>,
): Promise<T> {
  const ping = setInterval(() => {
    try {
      controller.enqueue(KEEPALIVE_CHUNK)
    } catch {
      // Controller already closed (client disconnected) — nothing to do.
    }
  }, 10_000)
  try {
    return await promise
  } finally {
    clearInterval(ping)
  }
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser()
  if (!user) {
    return new Response(
      `data: ${JSON.stringify({ stage: "error", message: "unauthorized", code: "unauthorized" })}\n\n`,
      { status: 401, headers: { "Content-Type": "text/event-stream" } },
    )
  }

  let body: { theme?: string; type?: string }
  try {
    body = await request.json()
  } catch {
    return new Response(
      `data: ${JSON.stringify({ stage: "error", message: "invalid_json", code: "invalid_body" })}\n\n`,
      { status: 400, headers: { "Content-Type": "text/event-stream" } },
    )
  }

  const theme = (body.theme ?? "").trim()
  if (!theme || theme.length < 3 || theme.length > 200) {
    return new Response(
      `data: ${JSON.stringify({ stage: "error", message: "invalid_theme", code: "invalid_theme" })}\n\n`,
      { status: 400, headers: { "Content-Type": "text/event-stream" } },
    )
  }

  const type: ActivityType =
    body.type === "support_material" ? "support_material" : "activity"

  const admin = createSupabaseAdmin()
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! })

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: SseStage) => controller.enqueue(sseChunk(data))

      let activityId: string | null = null
      let imagePath: string | null = null

      try {
        // Fast pre-flight: avoid burning API quota when obviously out of credits.
        const { data: balance, error: balanceErr } = await admin.rpc(
          "current_credit_balance",
          { p_user_id: user.id },
        )
        if (balanceErr || (balance as number) <= 0) {
          send({ stage: "error", message: "Saldo insuficiente.", code: "insufficient_balance" })
          controller.close()
          return
        }

        send({ stage: "generating_spec" })
        const spec = await withKeepalive(controller, generateSpec(theme, openai, type))

        send({ stage: "generating_image" })
        const imageBuffer = await withKeepalive(controller, generateImage(spec.image_prompt, openai))

        send({ stage: "saving" })
        activityId = randomUUID()
        imagePath = `${activityId}/activity.png`

        const { error: uploadErr } = await admin.storage
          .from("personalized")
          .upload(imagePath, imageBuffer, { contentType: "image/png", upsert: true })
        if (uploadErr) throw new Error(`upload_failed: ${uploadErr.message}`)

        const { error: insertErr } = await admin.from("activities").insert({
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
          user_id: user.id,
        })
        if (insertErr) throw new Error(`insert_failed: ${insertErr.message}`)

        // Atomic debit with advisory lock — prevents TOCTOU double-spend.
        const { data: consumed, error: consumeErr } = await admin.rpc("consume_credit", {
          p_user_id: user.id,
          p_activity_id: activityId,
          p_reason: `Geração: ${spec.title}`,
        })
        if (consumeErr || !consumed) {
          // Race condition: balance ran out between pre-check and now; roll back.
          try { await admin.from("activities").delete().eq("id", activityId) } catch { /* ignore */ }
          await admin.storage.from("personalized").remove([imagePath])
          activityId = null
          imagePath = null
          send({ stage: "error", message: "Saldo insuficiente.", code: "insufficient_balance" })
          controller.close()
          return
        }

        const slug = generateMaterialSlug(spec.theme, activityId)
        send({ stage: "done", activityId, slug })
        controller.close()
      } catch (err) {
        const message = err instanceof Error ? err.message : "unknown_error"
        console.error("[api/gerar]", message)
        // Clean up any partial state so orphaned rows don't accumulate.
        if (activityId) {
          try { await admin.from("activities").delete().eq("id", activityId) } catch { /* ignore */ }
        }
        if (imagePath) {
          try { await admin.storage.from("personalized").remove([imagePath]) } catch { /* ignore */ }
        }
        send({ stage: "error", message: "Algo deu errado. Tente novamente.", code: "generation_failed" })
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  })
}

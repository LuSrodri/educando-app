import { type NextRequest } from "next/server"
import OpenAI from "openai"
import { randomUUID } from "node:crypto"
import { getCurrentUser } from "@/lib/supabase/ssr-server"
import { createServerClient as createSupabaseAdmin } from "@/lib/supabase/server"
import {
  searchTavily,
  scrapeWithFirecrawl,
  generateSpec,
  generateImage,
} from "@/lib/generation"
import { generateMaterialSlug } from "@/lib/slug"

export const dynamic = "force-dynamic"
export const maxDuration = 180

type ActivityType = "activity" | "support_material"

type SseStage =
  | { stage: "searching" }
  | { stage: "enriching" }
  | { stage: "generating_spec" }
  | { stage: "generating_image" }
  | { stage: "saving" }
  | { stage: "done"; activityId: string; slug: string }
  | { stage: "error"; message: string; code?: string }

const encoder = new TextEncoder()

function sseChunk(data: SseStage): Uint8Array {
  return encoder.encode(`data: ${JSON.stringify(data)}\n\n`)
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
  const firecrawlKey = process.env.FIRECRAWL_API_KEY ?? ""

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: SseStage) => controller.enqueue(sseChunk(data))

      try {
        // Verifica saldo antes de iniciar (evita cobrar crédito por etapas inúteis)
        const { data: balance, error: balanceErr } = await admin.rpc(
          "current_credit_balance",
          { p_user_id: user.id },
        )
        if (balanceErr || (balance as number) <= 0) {
          send({ stage: "error", message: "Saldo insuficiente.", code: "insufficient_balance" })
          controller.close()
          return
        }

        send({ stage: "searching" })
        const { summary, urls } = await searchTavily(theme)

        send({ stage: "enriching" })
        let firecrawlContent = ""
        if (urls.length > 0) {
          const educationalUrl =
            urls.find((u) =>
              /nova-escola|mec\.gov|qedu|gestaoescolar|bncc|escolakids|brasilescola/.test(u),
            ) ?? urls[0]
          firecrawlContent = await scrapeWithFirecrawl(educationalUrl, firecrawlKey)
        }

        send({ stage: "generating_spec" })
        const spec = await generateSpec(theme, summary, firecrawlContent, openai, type)

        send({ stage: "generating_image" })
        const imageBuffer = await generateImage(spec.image_prompt, openai)

        send({ stage: "saving" })
        const activityId = randomUUID()
        const imagePath = `user/${user.id}/${activityId}/activity.png`

        const { error: uploadErr } = await admin.storage
          .from("activities")
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

        // Debita 1 crédito — só depois do sucesso completo
        const { error: ledgerErr } = await admin.from("credit_ledger").insert({
          user_id: user.id,
          delta: -1,
          kind: "consume",
          reason: `Geração: ${spec.title}`,
          activity_id: activityId,
        })
        if (ledgerErr) throw new Error(`ledger_failed: ${ledgerErr.message}`)

        const slug = generateMaterialSlug(spec.theme, activityId)
        send({ stage: "done", activityId, slug })
        controller.close()
      } catch (err) {
        const message = err instanceof Error ? err.message : "unknown_error"
        console.error("[api/gerar]", message)
        send({ stage: "error", message, code: "generation_failed" })
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

import { GoogleGenAI, ThinkingLevel } from "@google/genai"
import { createServerClient } from "@/lib/supabase/server"
import { incrementFortnightlyUsage, canGenerateFree } from "@/lib/credits"
import { hasPaidCredits, decrementPaidCredits } from "@/lib/paid-credits"
import { postPin } from "@/lib/pinterest"
import { validateBrowserId, validatePrompt, ValidationError } from "@/lib/validation"

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! })

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const browserId = validateBrowserId(body?.browserId)
    const prompt = validatePrompt(body?.prompt)
    const improvedPrompt =
      typeof body?.improvedPrompt === "string" && body.improvedPrompt.trim()
        ? body.improvedPrompt.trim()
        : null

    // Determine credit source: paid first, then free
    const isPaid = await hasPaidCredits(browserId)
    if (!isPaid) {
      const canGenerate = await canGenerateFree(browserId)
      if (!canGenerate) {
        return Response.json(
          { error: "Você usou todas as suas atividades gratuitas.", isPaywall: true },
          { status: 403 }
        )
      }
    }

    const finalPrompt = improvedPrompt || prompt

    // Generate image via Google GenAI
    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-image-preview",
      contents: finalPrompt,
      config: {
        thinkingConfig: {
          thinkingLevel: ThinkingLevel.HIGH,
        },
        imageConfig: {
          aspectRatio: "3:4",
          imageSize: "4K",
        },
        responseModalities: ["IMAGE"],
        tools: [
          {
            googleSearch: {},
          },
        ],
      },
    })

    const imagePart = response.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData)

    if (!imagePart?.inlineData?.data) {
      return Response.json({ error: "Nenhuma imagem gerada" }, { status: 500 })
    }

    const base64 = imagePart.inlineData.data
    const mediaType = imagePart.inlineData.mimeType || "image/png"
    const extension = mediaType.includes("png") ? "png" : "jpg"
    const imageBuffer = Buffer.from(base64, "base64")

    // Save to Supabase
    const supabase = createServerClient()
    const activityId = crypto.randomUUID()
    const imagePath = `${browserId}/${activityId}/activity.${extension}`

    const { error: uploadError } = await supabase.storage
      .from("activities")
      .upload(imagePath, imageBuffer, {
        contentType: mediaType,
        upsert: true,
      })

    if (uploadError) {
      console.error("Error uploading image:", uploadError)
    }

    // Create activity record
    const { data: activity, error: activityError } = await supabase
      .from("activities")
      .insert({
        id: activityId,
        browser_id: browserId,
        original_prompt: prompt,
        improved_prompt: improvedPrompt || prompt,
        image_path: imagePath,
        image_media_type: mediaType,
        is_paid: isPaid,
      })
      .select()
      .single()

    if (activityError) {
      console.error("Error creating activity:", activityError)
    }

    // Deduct credit
    if (isPaid) {
      await decrementPaidCredits(browserId)
    } else {
      await incrementFortnightlyUsage(browserId)
      // Auto-post to Pinterest (fire-and-forget — never blocks response)
      if (activity) {
        void postPin(activity)
      }
    }

    return Response.json({
      image: { base64, mediaType },
      activity,
      isPaid,
    })
  } catch (error) {
    if (error instanceof ValidationError) {
      return Response.json({ error: error.message }, { status: 400 })
    }
    console.error("Error generating activity:", error)
    return Response.json({ error: "Erro ao gerar atividade. Tente novamente." }, { status: 500 })
  }
}

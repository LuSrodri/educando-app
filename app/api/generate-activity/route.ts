import { GoogleGenAI, ThinkingLevel } from "@google/genai"
import { createServerClient } from "@/lib/supabase/server"
import { incrementDailyUsage, canGenerateFree } from "@/lib/credits"

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! })

export async function POST(req: Request) {
  try {
    const { prompt, browserId, improvedPrompt } = await req.json()

    if (!browserId) {
      return Response.json({ error: "Browser ID is required" }, { status: 400 })
    }

    // Check daily limit
    const canGenerate = await canGenerateFree(browserId)
    if (!canGenerate) {
      return Response.json({ error: "Limite diário de atividades atingido. Tente novamente amanhã!" }, { status: 403 })
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
          personGeneration: "",
        },
        responseModalities: [
          'IMAGE',
        ],
        tools: [
          {
            googleSearch: {
            }
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
      })
      .select()
      .single()

    if (activityError) {
      console.error("Error creating activity:", activityError)
    }

    // Deduct credit
    await incrementDailyUsage(browserId)

    return Response.json({
      image: { base64, mediaType },
      activity,
    })
  } catch (error) {
    console.error("Error generating activity:", error)
    return Response.json({ error: "Erro ao gerar atividade. Tente novamente." }, { status: 500 })
  }
}

import { GoogleGenAI } from "@google/genai"
import { createServerClient } from "@/lib/supabase/server"

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! })

export async function POST(req: Request) {
  try {
    const { editPrompt, currentImage, mediaType, browserId, parentActivityId, originalPrompt } = await req.json()

    if (!editPrompt || !currentImage) {
      return Response.json({ error: "Edit prompt and image are required" }, { status: 400 })
    }

    // Construir contexto com o prompt original se disponível
    const originalContext = originalPrompt
      ? `

CONTEXTO ORIGINAL DA ATIVIDADE:
A atividade foi criada com o seguinte prompt: "${originalPrompt}"
Use esse contexto para entender o propósito da atividade ao aplicar as edições.`
      : ""

    const fullPrompt = `Você está editando uma folha de atividade escolar existente.
${originalContext}

A imagem atual está anexada. Faça as seguintes modificações:

${editPrompt}

Mantenha o formato de folha de atividade escolar para impressão A4, em português brasileiro.
Preserve os elementos que não foram mencionados para alteração.
A atividade deve continuar sendo visualmente organizada e fácil de ler.
Mantenha a referência BNCC se existir.`

    const response = await ai.models.generateContent({
      model: "gemini-3-pro-image-preview",
      config: {
        responseModalities: ["IMAGE"],
        imageConfig: {
          imageSize: "2K",
        },
      },
      contents: [
        {
          role: "user",
          parts: [
            {
              inlineData: {
                data: currentImage,
                mimeType: mediaType || "image/png",
              },
            },
            { text: fullPrompt },
          ],
        },
      ],
    })

    // Extract image from response
    let imageData: { base64: string; mediaType: string } | null = null

    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          imageData = {
            base64: part.inlineData.data || "",
            mediaType: part.inlineData.mimeType || "image/png",
          }
          break
        }
      }
    }

    if (!imageData) {
      return Response.json({ error: "Nenhuma imagem gerada" }, { status: 500 })
    }

    let activity = null

    // Save as new version if we have browserId and parentActivityId
    if (browserId && parentActivityId) {
      const supabase = createServerClient()

      // Get parent activity details
      const { data: parentActivity } = await supabase
        .from("activities")
        .select("*")
        .eq("id", parentActivityId)
        .single()

      if (parentActivity) {
        const newActivityId = crypto.randomUUID()
        const imagePath = `${browserId}/${newActivityId}/activity.png`

        // Upload image to storage
        const imageBuffer = Buffer.from(imageData.base64, "base64")
        const { error: uploadError } = await supabase.storage
          .from("activities")
          .upload(imagePath, imageBuffer, {
            contentType: imageData.mediaType,
            upsert: true,
          })

        if (uploadError) {
          console.error("Error uploading image:", uploadError)
        }

        // Create new version linked to parent
        const { data: newActivity, error: activityError } = await supabase
          .from("activities")
          .insert({
            id: newActivityId,
            browser_id: browserId,
            parent_id: parentActivityId,
            original_prompt: parentActivity.original_prompt,
            improved_prompt: parentActivity.improved_prompt,
            edit_prompt: editPrompt,
            educational_level: parentActivity.educational_level,
            grade: parentActivity.grade,
            image_path: imagePath,
            image_media_type: imageData.mediaType,
            generation_type: "edit",
          })
          .select()
          .single()

        if (activityError) {
          console.error("Error creating activity version:", activityError)
        } else {
          activity = newActivity
        }
      }
    }

    // Extract text from response
    let text = ""
    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.text) {
          text += part.text
        }
      }
    }

    return Response.json({
      text,
      image: imageData,
      activity,
    })
  } catch (error) {
    console.error("Error editing activity:", error)
    return Response.json({ error: "Failed to edit activity" }, { status: 500 })
  }
}

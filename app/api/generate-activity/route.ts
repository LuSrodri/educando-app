import { GoogleGenAI } from "@google/genai"
import { createServerClient } from "@/lib/supabase/server"
import { incrementDailyUsage, useExtraCredit, canGenerateFree } from "@/lib/credits"
import { getEducationalLevelPromptContext, type EducationalLevelId } from "@/types/educational-levels"

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! })

export async function POST(req: Request) {
  try {
    const { prompt, browserId, educationalLevel, grade, improvedPrompt } = await req.json()

    if (!browserId) {
      return Response.json({ error: "Browser ID is required" }, { status: 400 })
    }

    // Check if user can generate
    const canGenerate = await canGenerateFree(browserId)
    if (!canGenerate) {
      const usedCredit = await useExtraCredit(browserId)
      if (!usedCredit) {
        return Response.json({ error: "No credits available" }, { status: 403 })
      }
    }

    const levelContext = getEducationalLevelPromptContext(
      (educationalLevel as EducationalLevelId) || "fundamental_1",
      grade || "1"
    )

    const fullPrompt = `Crie uma atividade escolar pronta para imprimir (em A4), em portugues brasileiro, com o seguinte tema:

${levelContext}

PROMPT_FROM_USER_START
${improvedPrompt || prompt}
PROMPT_FROM_USER_END

A atividade deve:
- Ter um titulo claro no topo
- Incluir espaco para nome do aluno e data
- Ter instrucoes claras e simples
- Incluir exercicios apropriados para a idade
- Ter ilustracoes educativas e atraentes
- Ser visualmente organizada e facil de ler
- Ter espacos adequados para as respostas
- Usar fontes legiveis e tamanho apropriado para a faixa etaria
- Ser em formato de documento de atividade escolar tradicional brasileira (A4) pronta para imprimir
- Os elementos visuais DEVEM SEMPRE ser coerentes com os textos e enunciados
- As tarefas devem ter poucos ou nenhum exemplos, e NUNCA DEVEM induzir ao erro
- Incluir referencia BNCC no rodape`

    const response = await ai.models.generateContent({
      model: "gemini-3-pro-image-preview",
      config: {
        responseModalities: ["IMAGE", "TEXT"],
        imageConfig: {
          imageSize: "2K",
        },
      },
      contents: [
        {
          role: "user",
          parts: [{ text: fullPrompt }],
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

    // Save to Supabase
    const supabase = createServerClient()
    const activityId = crypto.randomUUID()
    const imagePath = `${browserId}/${activityId}/activity.png`

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
      // Continue without saving to storage, just return the image
    }

    // Create activity record
    const { data: activity, error: activityError } = await supabase
      .from("activities")
      .insert({
        id: activityId,
        browser_id: browserId,
        original_prompt: prompt,
        improved_prompt: improvedPrompt || prompt,
        educational_level: educationalLevel || "fundamental_1",
        grade: grade || "1",
        image_path: imagePath,
        image_media_type: imageData.mediaType,
        generation_type: "original",
      })
      .select()
      .single()

    if (activityError) {
      console.error("Error creating activity:", activityError)
    }

    // Increment usage only if we successfully generated
    if (canGenerate) {
      await incrementDailyUsage(browserId)
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
    console.error("Error generating activity:", error)
    return Response.json({ error: "Failed to generate activity" }, { status: 500 })
  }
}

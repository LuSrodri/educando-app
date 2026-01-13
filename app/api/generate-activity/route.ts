import { GoogleGenAI } from "@google/genai"
import { createServerClient } from "@/lib/supabase/server"
import { incrementDailyUsage, useExtraCredit, canGenerateFree, getExtraCredits } from "@/lib/credits"
import { getEducationalLevelPromptContext, type EducationalLevelId } from "@/types/educational-levels"

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! })

// Interface para os elementos da atividade
interface ActivityElements {
  header: boolean
  title: boolean
  instructions: boolean
  illustrations: boolean
  bncc: boolean
}

// Função para construir instruções baseadas nos elementos selecionados
function buildElementsInstructions(elements: ActivityElements, activityType: string): string {
  const instructions: string[] = []

  if (elements.title) {
    instructions.push("- Ter um título claro no topo")
  }

  if (elements.header) {
    instructions.push("- Incluir espaço para nome do aluno e data")
  }

  if (elements.instructions) {
    instructions.push("- Ter instruções/enunciados claros e simples")
  }

  if (elements.illustrations) {
    instructions.push("- Ter ilustrações educativas e atraentes")
    instructions.push("- Os elementos visuais DEVEM SEMPRE ser coerentes com os textos e enunciados")
  } else {
    instructions.push("- NÃO incluir ilustrações ou imagens decorativas")
  }

  if (elements.bncc) {
    instructions.push("- Incluir referência BNCC no rodapé")
  } else {
    instructions.push("- NÃO incluir referência à BNCC")
  }

  // Instruções comuns
  instructions.push("- Ser visualmente organizada e fácil de ler")
  instructions.push("- Ter espaços adequados para as respostas")
  instructions.push("- Usar fontes legíveis e tamanho apropriado para a faixa etária")
  instructions.push("- Ser em formato de documento A4 pronto para imprimir")
  instructions.push("- As tarefas devem ter poucos ou nenhum exemplos, e NUNCA DEVEM induzir ao erro")

  return instructions.join("\n")
}

// Função para obter contexto baseado no tipo de atividade
function getActivityTypeContext(activityType: string): string {
  if (activityType === "teacher_support") {
    return `
TIPO DE MATERIAL: Material de Apoio Pedagógico para Professor
Este material é um RECURSO DE APOIO para uso do professor em sala de aula.
Deve ser prático e direto, sem necessidade de elementos pedagógicos complexos.
Exemplos: silabário para recorte, cartões de letras, fichas para montagem, material manipulável.
O layout deve ser funcional e otimizado para recorte/manipulação quando aplicável.
NÃO incluir espaços para nome do aluno ou cabeçalhos formais de atividade.`
  }

  return `
TIPO DE MATERIAL: Atividade para o Aluno
Este é um material pedagógico completo para ser entregue ao aluno.
Deve seguir uma organização pedagógica focada na experiência do aluno.
Incluir todos os elementos tradicionais de uma atividade escolar brasileira.`
}

export async function POST(req: Request) {
  try {
    const { prompt, browserId, educationalLevel, grade, improvedPrompt, activityType, elements } = await req.json()

    if (!browserId) {
      return Response.json({ error: "Browser ID is required" }, { status: 400 })
    }

    // Check if user can generate (free or paid)
    const canGenerateForFree = await canGenerateFree(browserId)
    const extraCredits = await getExtraCredits(browserId)
    const willUsePaidCredit = !canGenerateForFree && extraCredits > 0

    // If no free credits and no paid credits, block generation
    if (!canGenerateForFree && extraCredits <= 0) {
      return Response.json({ error: "No credits available" }, { status: 403 })
    }

    const levelContext = getEducationalLevelPromptContext(
      (educationalLevel as EducationalLevelId) || "fundamental_1",
      grade || "1"
    )

    // Elementos padrão se não fornecidos
    const activityElements: ActivityElements = elements || {
      header: true,
      title: true,
      instructions: true,
      illustrations: true,
      bncc: true,
    }

    const elementsInstructions = buildElementsInstructions(activityElements, activityType || "student")
    const activityTypeContext = getActivityTypeContext(activityType || "student")

    const fullPrompt = `FORMATO OBRIGATÓRIO: Documento em formato FOLHA A4 (210mm x 297mm), orientação RETRATO, pronto para impressão.

Crie um material escolar em português brasileiro, com o seguinte tema:

${levelContext}
${activityTypeContext}

PROMPT_FROM_USER_START
${improvedPrompt || prompt}
PROMPT_FROM_USER_END

O material deve:
${elementsInstructions}

IMPORTANTE: O documento DEVE estar em formato A4 retrato, ocupando toda a folha de forma organizada e pronta para imprimir.`

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

    // Deduct credits only after successful generation
    if (canGenerateForFree) {
      await incrementDailyUsage(browserId)
    } else if (willUsePaidCredit) {
      await useExtraCredit(browserId)
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

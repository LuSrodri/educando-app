import { generateText } from "ai"

export async function POST(req: Request) {
  const { editPrompt, currentImage, mediaType } = await req.json()

  const fullPrompt = `Você está editando uma folha de atividade escolar existente. 
  
A imagem atual está anexada. Faça as seguintes modificações:

${editPrompt}

Mantenha o formato de folha de atividade escolar para impressão A4, em português brasileiro.
Preserve os elementos que não foram mencionados para alteração.
A atividade deve continuar sendo visualmente organizada e fácil de ler.`

  const result = await generateText({
    model: "google/gemini-3-pro-image",
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: fullPrompt },
          {
            type: "image",
            image: currentImage,
            mimeType: mediaType,
          },
        ],
      },
    ],
  })

  let image = null
  for (const file of result.files) {
    if (file.mediaType.startsWith("image/")) {
      image = {
        base64: file.base64,
        mediaType: file.mediaType,
      }
      break
    }
  }

  return Response.json({
    text: result.text,
    image,
  })
}

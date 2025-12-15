import { generateText } from "ai"

export async function POST(req: Request) {
  const { prompt } = await req.json()

  const fullPrompt = `Crie uma atividade escolar pronta para imprimir (em A4), em português brasileiro, com o seguinte tema:

${prompt}

A atividade deve:
- Ter um título claro no topo
- Incluir espaço para nome do aluno e data
- Ter instruções claras e simples
- Incluir exercícios apropriados para a idade
- Ter ilustrações educativas e atraentes
- Ser visualmente organizada e fácil de ler
- Ter espaços adequados para as respostas
- Usar fontes legíveis e tamanho apropriado para crianças
- Ser em formato de documento de atividade escolar tradicional brasileira (A4) pronta para imprimir 
- Os elementos visuais DEVEM SEMPRE ser coerentes com os textos e enunciados
- As tarefas devem ter poucos ou nenhum exemplos, e NUNCA DEVEM induzir ao erro`

  const result = await generateText({
    model: "google/gemini-3-pro-image",
    prompt: fullPrompt,
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

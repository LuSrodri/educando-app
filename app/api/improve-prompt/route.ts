import { GoogleGenAI } from "@google/genai"
import { getEducationalLevelPromptContext, type EducationalLevelId } from "@/types/educational-levels"

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! })

export async function POST(req: Request) {
  const { prompt, educationalLevel, grade } = await req.json()

  const levelContext = getEducationalLevelPromptContext(
    (educationalLevel as EducationalLevelId) || "fundamental_1",
    grade || "1"
  )

  const systemPrompt = `Voce e um especialista em educacao brasileira e em design de materiais didaticos.

Sua tarefa e aprimorar o seguinte pedido de atividade escolar para que a IA grafica gere uma atividade pedagogicamente eficaz.

${levelContext}

Pedido original: "${prompt}"

DIRETRIZES OBRIGATORIAS para o aprimoramento:

**Elementos Visuais e Esteticos:**
- Inclua ilustracoes ludicas apropriadas para a faixa etaria
- Sugira icones, mascotes ou personagens infantis quando apropriado
- Especifique um layout organizado e limpo, adequado para folha A4

**Contexto Cultural Brasileiro:**
- Use referencias a cultura brasileira quando relevante, de forma diversa e sem estereotipos
- Siga as diretrizes da BNCC (Base Nacional Comum Curricular) para o nivel escolar
- Inclua nomes e contextos brasileiros nos exemplos e enunciados
- Respeite a diversidade cultural do Brasil

**Lingua Portuguesa Brasileira:**
- Todo o texto DEVE estar em Portugues do Brasil (PT-BR)
- Use ortografia oficial conforme o Acordo Ortografico
- Linguagem adequada a faixa etaria
- Enunciados claros e objetivos

**Estrutura Pedagogica:**
- Especifique claramente o ano/nivel escolar
- Inclua espacos adequados para respostas (linhas, quadrados, lacunas)
- Adicione um titulo e instrucoes claras
- Considere diferentes niveis de dificuldade quando apropriado

**Referencia BNCC (OBRIGATORIO):**
- A atividade DEVE incluir um rodape ou caixa de destaque com a referencia a BNCC
- Formato obrigatorio: "BNCC: [Codigo] - [Habilidade]"
- Identifique a Competencia Geral e a Habilidade Especifica mais adequada ao conteudo
- Para Educacao Infantil, use codigos EI. Para Ensino Fundamental, use EF.
- Componentes: LP (Lingua Portuguesa), MA (Matematica), CI (Ciencias), GE (Geografia), HI (Historia), AR (Arte), EF (Educacao Fisica), ER (Ensino Religioso)

Retorne APENAS o prompt aprimorado, sem explicacoes. O prompt deve instruir a geracao de uma atividade escolar brasileira, COM a referencia BNCC visivel na atividade.`

  const response = await ai.models.generateContentStream({
    model: "gemini-3-flash-preview",
    config: {
      thinkingConfig: {
        thinkingLevel: "MINIMAL",
      },
    },
    contents: [
      {
        role: "user",
        parts: [{ text: systemPrompt }],
      },
    ],
  })

  let improvedPrompt = ""
  for await (const chunk of response) {
    improvedPrompt += chunk.text || ""
  }

  return Response.json({ improvedPrompt })
}

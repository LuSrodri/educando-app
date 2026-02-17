import { GoogleGenAI, ThinkingLevel } from "@google/genai"

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! })

interface ActivityElements {
  header: boolean
  title: boolean
  instructions: boolean
  illustrations: boolean
  bncc: boolean
}

function buildElementsContext(elements: ActivityElements): string {
  const include: string[] = []
  const exclude: string[] = []

  if (elements.header) include.push("cabeçalho com espaço para nome do aluno e data")
  else exclude.push("cabeçalho ou espaços para nome/data")

  if (elements.title) include.push("título claro e chamativo")
  else exclude.push("título")

  if (elements.instructions) include.push("enunciados e instruções claras")
  else exclude.push("enunciados longos ou instruções detalhadas")

  if (elements.illustrations) include.push("ilustrações educativas e atraentes")
  else exclude.push("ilustrações ou imagens decorativas")

  if (elements.bncc) include.push("referência à BNCC no rodapé")
  else exclude.push("referência à BNCC")

  let context = ""
  if (include.length > 0) context += `\n**Elementos a INCLUIR:** ${include.join(", ")}.`
  if (exclude.length > 0) context += `\n**Elementos a NÃO incluir:** ${exclude.join(", ")}.`

  return context
}

function getActivityTypeContext(activityType: string): string {
  if (activityType === "teacher_support") {
    return `
**TIPO DE MATERIAL: Material de Apoio Pedagógico para Professor**
Este NÃO é uma atividade para o aluno. É um MATERIAL DE APOIO para uso do professor.
Exemplos: silabário para recorte, cartões de letras/números, fichas para montagem, material manipulável, jogos pedagógicos para imprimir.
O material deve ser prático, funcional e otimizado para recorte/manipulação.
NÃO incluir elementos formais de atividade escolar (cabeçalho, nome do aluno, etc).`
  }

  return `
**TIPO DE MATERIAL: Atividade para o Aluno**
Este é um material pedagógico COMPLETO e pronto para ser entregue ao aluno.
Deve seguir a estrutura tradicional de atividade escolar brasileira.`
}

export async function POST(req: Request) {
  const { prompt, activityType, elements } = await req.json()

  const activityElements: ActivityElements = elements || {
    header: true,
    title: true,
    instructions: true,
    illustrations: true,
    bncc: true,
  }

  const elementsContext = buildElementsContext(activityElements)
  const activityTypeContext = getActivityTypeContext(activityType || "student")

  const systemPrompt = `Você é um especialista em educação brasileira e em design de materiais didáticos.

Sua tarefa é, de acordo com o seguinte pedido do usuário, gerar um prompt otimizado para uma IA de geração de imagens 
criar um material pedagogicamente eficaz e útil.

IMPORTANTE: O nível educacional e a série/ano devem ser inferidos a partir do próprio prompt do usuário. 
Se o usuário mencionar um ano específico (ex: "3º ano"), uma faixa etária, ou um nível (ex: "alfabetização",
 "ensino fundamental"), use essa informação. Se não mencionar, assuma Ensino Fundamental I (1º ao 5º ano) como padrão.

${activityTypeContext}
${elementsContext}

Pedido original: "${prompt}"

DIRETRIZES OBRIGATÓRIAS para o aprimoramento:

**FORMATO OBRIGATÓRIO:**
- O material DEVE ser em formato FOLHA A4 RETRATO (2480px x 3508px)
- Deve ocupar toda a folha de forma organizada
- Deve estar pronto para impressão direta

${activityElements.illustrations
      ? `**Elementos Visuais e Estéticos:**
- Inclua ilustrações lúdicas apropriadas para a faixa etária
- Sugira ícones, mascotes ou personagens infantis quando apropriado
- Especifique um layout organizado e limpo, adequado para folha A4`
      : `**Layout:**
- NÃO inclua ilustrações ou imagens decorativas
- Foque em um layout limpo e funcional, adequado para folha A4`}

**Contexto Cultural Brasileiro:**
- Use referências à cultura brasileira quando relevante
- Siga as diretrizes da BNCC (Base Nacional Comum Curricular)
- Inclua nomes e contextos brasileiros nos exemplos
- Respeite a diversidade cultural do Brasil

**Língua Portuguesa Brasileira:**
- Todo o texto DEVE estar em Português do Brasil (PT-BR)
- Use ortografia oficial conforme o Acordo Ortográfico
- Linguagem adequada à faixa etária
- Enunciados claros e objetivos

${activityType === "teacher_support"
      ? `**Estrutura do Material de Apoio:**
- Foque na funcionalidade e praticidade do material
- Otimize para recorte, montagem ou manipulação quando aplicável
- Use elementos visuais claros e bem definidos`
      : `**Estrutura Pedagógica:**
- Inclua espaços adequados para respostas (linhas, quadrados, lacunas)
${activityElements.title ? "- Adicione um título e instruções claras" : ""}
- Considere diferentes níveis de dificuldade quando apropriado`}

${activityElements.bncc
      ? `**Referência BNCC (OBRIGATÓRIO):**
- A atividade DEVE incluir referência à BNCC
- Formato: "BNCC: [Código] - [Habilidade]"
- Identifique a Competência e Habilidade mais adequada ao conteúdo`
      : `**Referência BNCC:**
- NÃO incluir referência à BNCC neste material.`}

Retorne APENAS o prompt aprimorado, sem explicações. O prompt deve instruir a geração de um material escolar brasileiro em formato A4 retrato.
DEVE conter quais elementos serão gerados e suas posições na folha, seguindo as diretrizes acima. Seja específico e detalhado para garantir um resultado de alta qualidade.
DEVE gerar os textos que devem aparecer na atividade, como título, enunciados, BNCC, instruções, e quaisquer outros textos relevantes.

Basicamente você vai detalhar minuciosamente o que deve conter na folha A4, onde cada elemento deve estar posicionado, e como deve ser a aparência geral do material, seguindo as diretrizes fornecidas.

Você DEVE apontar a disposição dos elementos na folha. Lembrando que a largura da folha A4 é 2480 pixels e a altura é 3508 pixels.

O modelo de geração de imagens (bytedance/seedream-4.5) é extremamente literal, então seja o mais específico possível para garantir que o resultado final seja exatamente como desejado, coerente, e verdadeiramente útil para o ensino fundamental.

A margem deve ser simples e exatamente de 59 pixels em todos os lados. O conteúdo deve estar dentro dessa margem.
`

  const response = await ai.models.generateContentStream({
    model: "gemini-3-pro-preview",
    config: {
      thinkingConfig: {
        thinkingLevel: ThinkingLevel.HIGH,
      },
      tools: [
        {
          googleSearch: {
          }
        },
      ],
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

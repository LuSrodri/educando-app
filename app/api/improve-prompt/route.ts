import { GoogleGenAI, ThinkingLevel } from "@google/genai"
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

// Função para construir instruções de elementos para o prompt improver
function buildElementsContext(elements: ActivityElements): string {
  const include: string[] = []
  const exclude: string[] = []

  if (elements.header) {
    include.push("cabeçalho com espaço para nome do aluno e data")
  } else {
    exclude.push("cabeçalho ou espaços para nome/data")
  }

  if (elements.title) {
    include.push("título claro e chamativo")
  } else {
    exclude.push("título")
  }

  if (elements.instructions) {
    include.push("enunciados e instruções claras")
  } else {
    exclude.push("enunciados longos ou instruções detalhadas")
  }

  if (elements.illustrations) {
    include.push("ilustrações educativas e atraentes")
  } else {
    exclude.push("ilustrações ou imagens decorativas")
  }

  if (elements.bncc) {
    include.push("referência à BNCC no rodapé")
  } else {
    exclude.push("referência à BNCC")
  }

  let context = ""
  if (include.length > 0) {
    context += `\n**Elementos a INCLUIR:** ${include.join(", ")}.`
  }
  if (exclude.length > 0) {
    context += `\n**Elementos a NÃO incluir:** ${exclude.join(", ")}.`
  }

  return context
}

// Função para obter contexto do tipo de atividade
function getActivityTypeContextForImprover(activityType: string): string {
  if (activityType === "teacher_support") {
    return `
**TIPO DE MATERIAL: Material de Apoio Pedagógico para Professor**
Este NÃO é uma atividade para o aluno. É um MATERIAL DE APOIO para uso do professor.
Exemplos: silabário para recorte, cartões de letras/números, fichas para montagem, material manipulável, jogos pedagógicos para imprimir.
O material deve ser prático, funcional e otimizado para recorte/manipulação.
NÃO incluir elementos formais de atividade escolar (cabeçalho, nome do aluno, etc).
Foque em criar um recurso útil e visualmente claro para o professor usar com os alunos.`
  }

  return `
**TIPO DE MATERIAL: Atividade para o Aluno**
Este é um material pedagógico completo para ser entregue ao aluno.
Deve seguir a estrutura tradicional de atividade escolar brasileira.
Inclua todos os elementos pedagógicos apropriados para a faixa etária.`
}

export async function POST(req: Request) {
  const { prompt, educationalLevel, grade, activityType, elements } = await req.json()

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

  const elementsContext = buildElementsContext(activityElements)
  const activityTypeContext = getActivityTypeContextForImprover(activityType || "student")

  // Construir diretrizes baseadas nas opções
  const illustrationsGuideline = activityElements.illustrations
    ? `**Elementos Visuais e Estéticos:**
- Inclua ilustrações lúdicas apropriadas para a faixa etária
- Sugira ícones, mascotes ou personagens infantis quando apropriado
- Especifique um layout organizado e limpo, adequado para folha A4`
    : `**Layout:**
- NÃO inclua ilustrações ou imagens decorativas
- Foque em um layout limpo e funcional, adequado para folha A4`

  const bnccGuideline = activityElements.bncc
    ? `**Referência BNCC (OBRIGATÓRIO):**
- A atividade DEVE incluir um rodapé ou caixa de destaque com a referência à BNCC
- Formato obrigatório: "BNCC: [Código] - [Habilidade]"
- Identifique a Competência Geral e a Habilidade Específica mais adequada ao conteúdo
- Para Educação Infantil, use códigos EI. Para Ensino Fundamental, use EF.
- Componentes: LP (Língua Portuguesa), MA (Matemática), CI (Ciências), GE (Geografia), HI (História), AR (Arte), EF (Educação Física), ER (Ensino Religioso)`
    : `**Referência BNCC:**
- NÃO incluir referência à BNCC neste material.`

  const structureGuideline = activityType === "teacher_support"
    ? `**Estrutura do Material de Apoio:**
- Foque na funcionalidade e praticidade do material
- Otimize para recorte, montagem ou manipulação quando aplicável
- Use elementos visuais claros e bem definidos
- Não inclua espaços para respostas escritas (não é atividade do aluno)`
    : `**Estrutura Pedagógica:**
- Especifique claramente o ano/nível escolar
- Inclua espaços adequados para respostas (linhas, quadrados, lacunas)
${activityElements.title ? "- Adicione um título e instruções claras" : ""}
- Considere diferentes níveis de dificuldade quando apropriado`

  const systemPrompt = `Você é um especialista em educação brasileira e em design de materiais didáticos.

Sua tarefa é aprimorar o seguinte pedido para que a IA gráfica gere um material pedagogicamente eficaz.

${levelContext}
${activityTypeContext}
${elementsContext}

Pedido original: "${prompt}"

DIRETRIZES OBRIGATÓRIAS para o aprimoramento:

**FORMATO OBRIGATÓRIO:**
- O material DEVE ser em formato FOLHA A4 (210mm x 297mm), orientação RETRATO
- Deve ocupar toda a folha de forma organizada
- Deve estar pronto para impressão direta

${illustrationsGuideline}

**Contexto Cultural Brasileiro:**
- Use referências à cultura brasileira quando relevante, de forma diversa e sem estereótipos
- Siga as diretrizes da BNCC (Base Nacional Comum Curricular) para o nível escolar
- Inclua nomes e contextos brasileiros nos exemplos e enunciados
- Respeite a diversidade cultural do Brasil

**Língua Portuguesa Brasileira:**
- Todo o texto DEVE estar em Português do Brasil (PT-BR)
- Use ortografia oficial conforme o Acordo Ortográfico
- Linguagem adequada à faixa etária
- Enunciados claros e objetivos

${structureGuideline}

${bnccGuideline}

Retorne APENAS o prompt aprimorado, sem explicações. O prompt deve instruir a geração de um material escolar brasileiro em formato A4 retrato, adequado ao tipo solicitado.`

  const response = await ai.models.generateContentStream({
    model: "gemini-3-flash-preview",
    config: {
      thinkingConfig: {
        thinkingLevel: ThinkingLevel.MINIMAL,
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

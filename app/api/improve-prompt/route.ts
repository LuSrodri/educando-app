import { GoogleGenAI, ThinkingLevel } from "@google/genai"
import { canGenerateFree } from "@/lib/credits"
import {
  validatePrompt,
  validateBrowserId,
  validateActivityType,
  validateElements,
  ValidationError,
} from "@/lib/validation"

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! })

interface ActivityElements {
  header: boolean
  title: boolean
  instructions: boolean
  illustrations: boolean
  bncc: boolean
}

type ActivityType = "student" | "teacher_support"

function buildHardConstraints(elements: ActivityElements, activityType: ActivityType): string {
  const forbidden: string[] = []
  const required: string[] = []

  if (activityType === "teacher_support") {
    forbidden.push(
      "cabeçalho com nome/data do aluno",
      "enunciados dirigidos ao aluno",
      "espaços para resposta individual"
    )
    required.push(
      "layout funcional para recorte ou manipulação",
      "elementos visuais grandes e bem definidos"
    )
  } else {
    if (!elements.header) {
      forbidden.push("cabeçalho, linhas para Nome, Data, e afins")
    } else {
      required.push('cabeçalho, linhas para Nome, Data, e afins"')
    }

    if (!elements.title) {
      forbidden.push("título da atividade")
    } else {
      required.push("título centralizado e chamativo no topo da folha")
    }

    if (!elements.instructions) {
      forbidden.push("enunciados, instruções, textos de pergunta ou explicação")
    } else {
      required.push("enunciados claros para cada questão ou exercício")
    }

    if (!elements.illustrations) {
      forbidden.push("ilustrações, desenhos, imagens decorativas, cliparts, ícones visuais de qualquer tipo")
    } else {
      required.push("ilustrações lúdicas e coloridas adequadas à faixa etária")
    }

    if (!elements.bncc) {
      forbidden.push("referência à BNCC, código de habilidade BNCC, menção à Base Nacional Comum Curricular")
    } else {
      required.push('rodapé com "BNCC: [código exato] - [descrição da habilidade]"')
    }
  }

  let result = ""
  if (forbidden.length > 0) {
    result += `⛔ PROIBIDO — NÃO incluir de forma alguma:\n${forbidden.map((f) => `  • ${f}`).join("\n")}`
  }
  if (required.length > 0) {
    result += `\n\n✅ OBRIGATÓRIO — deve aparecer no material:\n${required.map((r) => `  • ${r}`).join("\n")}`
  }
  return result
}

const SYSTEM_INSTRUCTION = `Você é um especialista em design de materiais didáticos brasileiros e em engenharia de prompts para modelos de geração de imagem.

Sua função é converter um pedido de atividade escolar em um prompt visual útil para o modelo de imagem gemini-3-pro-image-preview.

SOBRE O MODELO DE IMAGEM:
- O gemini-3-pro-image-preview gera exatamente o que o prompt descreve, nada mais, nada menos.
- Prompts eficazes descrevem o resultado visual final, mostrando as intenções pedagógicas.
- Especifique posições na página, cores, textos que devem aparecer, tamanhos relativos dos elementos.
- O prompt deve ser escrito como uma descrição visual com a real intenção..

FORMATO FIXO DO MATERIAL:
- Folha A4, fundo branco puro
- Margem simples, pequena, e uniforme em todos os lados
- Pronto para enviar direto para impressão

IDIOMA: Todo texto visível na atividade DEVE estar em Português do Brasil (PT-BR).
CONTEXTO: Use nomes brasileiros, cenários e referências culturais do Brasil.`

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const prompt = validatePrompt(body?.prompt)
    const browserId = validateBrowserId(body?.browserId)
    const activityType = validateActivityType(body?.activityType)
    const elements = validateElements(body?.elements)

    // Check daily credit limit before doing anything
    const canGenerate = await canGenerateFree(browserId)
    if (!canGenerate) {
      return Response.json(
        { error: "Limite diário de atividades atingido. Tente novamente amanhã!", isCreditLimit: true },
        { status: 403 }
      )
    }

    // Safety check before improving the prompt
    try {
      const safetyResponse = await fetch(new URL("/api/check-prompt-safety", req.url).toString(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      })

      if (safetyResponse.ok) {
        const safetyData = await safetyResponse.json()
        if (safetyData.isCheating) {
          return Response.json(
            { error: "Não foi possível processar sua solicitação. Tente novamente mais tarde.", isSafetyBlock: true },
            { status: 400 }
          )
        }
      }
    } catch (safetyError) {
      console.error("Safety check error (continuing):", safetyError)
    }

    const type: ActivityType = activityType
    const activityElements: ActivityElements =
      type === "student" ? elements : {
        header: true,
        title: true,
        instructions: true,
        illustrations: true,
        bncc: true,
      }

    const constraints = buildHardConstraints(activityElements, type)

    const materialTypeLabel =
      type === "teacher_support"
        ? "Material de Apoio Pedagógico para Professor (silabário, cartões, fichas, jogo para imprimir)"
        : "Atividade para o Aluno (folha de exercícios pronta para imprimir e entregar)"

    const userMessage = `TIPO DE MATERIAL: ${materialTypeLabel}

RESTRIÇÕES DE ELEMENTOS (seguir rigorosamente):
${constraints}

PEDIDO DO USUÁRIO:
${JSON.stringify(prompt)}

NÍVEL EDUCACIONAL: Infira do pedido. Se não mencionado, assuma Ensino Fundamental I (1º ao 5º ano).

---

Gere o prompt visual detalhado. Estruture assim:

1. Descrição geral da folha (esquema de cores, estilo visual, clima da atividade)
2. Cada seção com posição aproximada:
   - Texto exato que aparece (títulos, enunciados, alternativas, exemplos, etc.)
   - Estilo visual (cor, negrito, tamanho relativo)
   - Ilustrações: descreva o que aparece em cada uma
3. Espaços para resposta: linhas tracejadas, quadradinhos, lacunas — o que for adequado
4. Rodapé

IMPORTANTE: Escreva os textos reais que devem aparecer na atividade, não apenas "um título" — escreva o título completo. Não escreva "enunciados claros" — escreva os enunciados. Crie conteúdo concreto e pedagogicamente correto.

Retorne APENAS o prompt, sem introdução, sem explicação, sem markdown.`

    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        thinkingConfig: {
          thinkingLevel: ThinkingLevel.HIGH,
        },
        tools: [
          {
            googleSearch: {},
          },
        ],
      },
      contents: [
        {
          role: "user",
          parts: [{ text: userMessage }],
        },
      ],
    })

    const improvedPrompt = response.text ?? ""

    return Response.json({ improvedPrompt })
  } catch (error) {
    if (error instanceof ValidationError) {
      return Response.json({ error: error.message }, { status: 400 })
    }
    console.error("Error in improve-prompt:", error)
    return Response.json({ error: "Erro ao processar sua solicitação." }, { status: 500 })
  }
}

// GPT-5.4-nano image classifier + metadata extractor used by the external
// enrichment pipeline. Returns whether an image is usable for the directory
// (portrait orientation + sufficient quality + matches the user query) and,
// when usable, a full set of directory metadata matching the internal schema.

import OpenAI from "openai"

const MODEL = "gpt-5.4-nano"

const SYSTEM_PROMPT = [
  "Você classifica imagens candidatas a materiais pedagógicos brasileiros para um diretório de professores.",
  "Receba uma imagem externa e a busca que motivou o candidato, avalie:",
  "- É formato retrato (altura > largura, aspect ratio >= 1.2)?",
  "- É de qualidade adequada para impressão A4 (legível, sem pixelização grosseira, sem artefatos destrutivos)?",
  "- É uma atividade (com espaços para o aluno responder) ou material de apoio (pôster, tabela, cronograma, referência)?",
  "- É AUTOSSUFICIENTE para uso direto? O professor deveria poder imprimir (ou exibir/recortar) a imagem como está e já ter um material funcional em sala.",
  "",
  "SOBRE AUTOSSUFICIÊNCIA (self_sufficient) — é o critério mais importante depois da qualidade visual.",
  "Marque self_sufficient=false quando a imagem for CAPA, PRÉVIA, THUMBNAIL, MONTAGEM PROMOCIONAL ou DIVULGAÇÃO do material, e não o material em si. Sinais:",
  "- Várias peças pequenas (cartas, cards, páginas) dispersas sobre um fundo decorado/colorido, com espaço entre elas — é uma composição de vitrine, não uma folha imprimível.",
  "- Combina um 'card de título' com mascote/ilustração ao lado de amostras reduzidas do conteúdo.",
  "- Mostra apenas 2-6 itens de exemplo de um conjunto que obviamente precisa de dezenas (dominó, bingo, flashcards, jogo da memória) para funcionar.",
  "- Marca d'água, URL, logo de criador ou faixa 'prévia/preview/sample' visível.",
  "- Fundo colorido ocupando a página (teal, rosa, azul chapado) em vez de fundo branco A4.",
  "- Moldura decorativa em volta de miniaturas, típica de post de Instagram/Pinterest/blog.",
  "Marque self_sufficient=true quando for uma única folha A4 completa (ou um pôster/tabela inteiro) com fundo branco/neutro, conteúdo legível em tamanho real, e que sozinha já serve ao aluno ou à sala.",
  "",
  "Se a imagem for apropriada (portrait + qualidade OK + autossuficiente + claramente pedagógica em pt-BR ou traduzível), produza metadados em pt-BR:",
  '- "title": 3-80 caracteres, claro, sem aspas',
  '- "theme": disciplina/tema (ex.: "Alfabetização", "Matemática — Tabuada")',
  '- "short_description": 1 frase 50-200 caracteres',
  '- "long_description": 2-4 frases 200-900 caracteres com faixa etária/ano e sugestão de uso',
  '- "bncc_codes": códigos BNCC aplicáveis no formato "EI01CG03", "EF03MA07", "EM13LP12" (pode ser vazio; NUNCA invente)',
  '- "type": "activity" ou "support_material"',
  "",
  "Se a imagem NÃO servir (paisagem, baixa qualidade, capa/prévia não autossuficiente, conteúdo não-pedagógico, NSFW, foto genérica), retorne usable=false, self_sufficient=false e preencha campos de texto com strings vazias.",
  "Responda ESTRITAMENTE conforme o JSON Schema fornecido.",
].join("\n")

const JSON_SCHEMA = {
  name: "image_candidate",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      usable: { type: "boolean" },
      portrait: { type: "boolean" },
      self_sufficient: { type: "boolean" },
      quality: { type: "string", enum: ["high", "medium", "low"] },
      title: { type: "string" },
      theme: { type: "string" },
      short_description: { type: "string" },
      long_description: { type: "string" },
      bncc_codes: {
        type: "array",
        items: { type: "string", pattern: "^(EI|EF|EM)[0-9A-Z]{2,10}$" },
      },
      type: { type: "string", enum: ["activity", "support_material"] },
    },
    required: [
      "usable",
      "portrait",
      "self_sufficient",
      "quality",
      "title",
      "theme",
      "short_description",
      "long_description",
      "bncc_codes",
      "type",
    ],
  },
} as const

export interface ClassifiedImage {
  usable: boolean
  portrait: boolean
  self_sufficient: boolean
  quality: "high" | "medium" | "low"
  title: string
  theme: string
  short_description: string
  long_description: string
  bncc_codes: string[]
  type: "activity" | "support_material"
}

export async function classifyImageCandidate(
  imageUrl: string,
  userQuery: string,
): Promise<ClassifiedImage> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error("OPENAI_API_KEY missing")

  const openai = new OpenAI({ apiKey })

  const resp = await openai.chat.completions.create({
    model: MODEL,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `Busca do professor: ${userQuery}\n\nAvalie a imagem abaixo.`,
          },
          { type: "image_url", image_url: { url: imageUrl } },
        ],
      },
    ],
    response_format: { type: "json_schema", json_schema: JSON_SCHEMA },
  })

  const raw = resp.choices?.[0]?.message?.content
  if (!raw) throw new Error("openai_empty_completion")
  return JSON.parse(raw) as ClassifiedImage
}

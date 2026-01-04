export const EDUCATIONAL_LEVELS = {
  alfabetizacao: {
    id: "alfabetizacao",
    name: "Alfabetização",
    displayName: "Alfabetização",
    grades: ["Pre-1", "Pre-2"],
    ageRange: "4-6 anos",
    description: "Educação Infantil - Pré-escola",
    bnccPrefix: "EI",
  },
  fundamental_1: {
    id: "fundamental_1",
    name: "Ensino Fundamental I",
    displayName: "Fundamental I",
    grades: ["1", "2", "3", "4", "5"],
    ageRange: "6-10 anos",
    description: "Ensino Fundamental - Anos Iniciais",
    bnccPrefix: "EF",
  },
  fundamental_2: {
    id: "fundamental_2",
    name: "Ensino Fundamental II",
    displayName: "Fundamental II",
    grades: ["6", "7", "8", "9"],
    ageRange: "11-14 anos",
    description: "Ensino Fundamental - Anos Finais",
    bnccPrefix: "EF",
  },
} as const

export type EducationalLevelId = keyof typeof EDUCATIONAL_LEVELS
export type EducationalLevel = (typeof EDUCATIONAL_LEVELS)[EducationalLevelId]

export function getEducationalLevelById(id: string): EducationalLevel | undefined {
  return EDUCATIONAL_LEVELS[id as EducationalLevelId]
}

export function getGradeLabel(levelId: EducationalLevelId, grade: string): string {
  if (levelId === "alfabetizacao") {
    return grade === "Pre-1" ? "Pré 1" : "Pré 2"
  }
  return `${grade}º ano`
}

export function getEducationalLevelPromptContext(levelId: EducationalLevelId, grade: string): string {
  const level = EDUCATIONAL_LEVELS[levelId]

  switch (levelId) {
    case "alfabetizacao":
      return `
Nível: Educação Infantil - ${grade === "Pre-1" ? "Pré-escola I (4-5 anos)" : "Pré-escola II (5-6 anos)"}
Foco: Alfabetização e letramento inicial, desenvolvimento motor, socialização
Diretrizes BNCC: Campos de experiências (EI)
- O eu, o outro e o nós
- Corpo, gestos e movimentos
- Traços, sons, cores e formas
- Escuta, fala, pensamento e imaginação
- Espaços, tempos, quantidades, relações e transformações

A atividade deve:
- Usar letras maiúsculas e fontes grandes
- Ter muitas ilustrações coloridas
- Incluir atividades de coordenação motora
- Ser lúdica e divertida
- Ter instruções simples com apoio visual
`
    case "fundamental_1":
      return `
Nível: Ensino Fundamental I - ${grade}º ano (${parseInt(grade) + 5}-${parseInt(grade) + 6} anos)
Foco: Alfabetização, letramento, cálculo básico, ciências naturais e sociais
Diretrizes BNCC: Habilidades EF (${level.bnccPrefix}${grade.padStart(2, "0")})

A atividade deve:
- Usar linguagem clara e adequada à idade
- Incluir ilustrações educativas
- Ter exercícios progressivos em dificuldade
- Seguir as competências da BNCC para o ano
- Incluir espaços adequados para respostas
`
    case "fundamental_2":
      return `
Nível: Ensino Fundamental II - ${grade}º ano (${parseInt(grade) + 5}-${parseInt(grade) + 6} anos)
Foco: Aprofundamento em todas as áreas do conhecimento
Diretrizes BNCC: Habilidades EF (${level.bnccPrefix}${grade.padStart(2, "0")})

A atividade deve:
- Usar linguagem formal adequada à faixa etária
- Incluir questões que estimulem o pensamento crítico
- Ter exercícios mais complexos e desafiadores
- Seguir as competências da BNCC para o ano
- Permitir respostas dissertativas quando apropriado
- Incluir contextualização e problemas do mundo real
`
    default:
      return ""
  }
}

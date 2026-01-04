export const EDUCATIONAL_LEVELS = {
  alfabetizacao: {
    id: "alfabetizacao",
    name: "Alfabetizacao",
    displayName: "Alfabetizacao",
    grades: ["Pre-1", "Pre-2"],
    ageRange: "4-6 anos",
    description: "Educacao Infantil - Pre-escola",
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
    return grade === "Pre-1" ? "Pre 1" : "Pre 2"
  }
  return `${grade}o ano`
}

export function getEducationalLevelPromptContext(levelId: EducationalLevelId, grade: string): string {
  const level = EDUCATIONAL_LEVELS[levelId]

  switch (levelId) {
    case "alfabetizacao":
      return `
Nivel: Educacao Infantil - ${grade === "Pre-1" ? "Pre-escola I (4-5 anos)" : "Pre-escola II (5-6 anos)"}
Foco: Alfabetizacao e letramento inicial, desenvolvimento motor, socializacao
Diretrizes BNCC: Campos de experiencias (EI)
- O eu, o outro e o nos
- Corpo, gestos e movimentos
- Tracos, sons, cores e formas
- Escuta, fala, pensamento e imaginacao
- Espacos, tempos, quantidades, relacoes e transformacoes

A atividade deve:
- Usar letras maiusculas e fontes grandes
- Ter muitas ilustracoes coloridas
- Incluir atividades de coordenacao motora
- Ser ludica e divertida
- Ter instrucoes simples com apoio visual
`
    case "fundamental_1":
      return `
Nivel: Ensino Fundamental I - ${grade}o ano (${parseInt(grade) + 5}-${parseInt(grade) + 6} anos)
Foco: Alfabetizacao, letramento, calculo basico, ciencias naturais e sociais
Diretrizes BNCC: Habilidades EF (${level.bnccPrefix}${grade.padStart(2, "0")})

A atividade deve:
- Usar linguagem clara e adequada a idade
- Incluir ilustracoes educativas
- Ter exercicios progressivos em dificuldade
- Seguir as competencias da BNCC para o ano
- Incluir espacos adequados para respostas
`
    case "fundamental_2":
      return `
Nivel: Ensino Fundamental II - ${grade}o ano (${parseInt(grade) + 5}-${parseInt(grade) + 6} anos)
Foco: Aprofundamento em todas as areas do conhecimento
Diretrizes BNCC: Habilidades EF (${level.bnccPrefix}${grade.padStart(2, "0")})

A atividade deve:
- Usar linguagem formal adequada a faixa etaria
- Incluir questoes que estimulem o pensamento critico
- Ter exercicios mais complexos e desafiadores
- Seguir as competencias da BNCC para o ano
- Permitir respostas dissertativas quando apropriado
- Incluir contextualizacao e problemas do mundo real
`
    default:
      return ""
  }
}

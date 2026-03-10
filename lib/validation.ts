export class ValidationError extends Error {
  readonly status = 400
  constructor(message: string) {
    super(message)
    this.name = "ValidationError"
  }
}

export function validateBrowserId(value: unknown): string {
  if (typeof value !== "string" || !value.trim()) {
    throw new ValidationError("Browser ID inválido")
  }
  if (value.length > 128) {
    throw new ValidationError("Browser ID inválido")
  }
  return value.trim()
}

export function validatePrompt(value: unknown): string {
  if (typeof value !== "string" || !value.trim()) {
    throw new ValidationError("Prompt é obrigatório")
  }
  if (value.trim().length < 3) {
    throw new ValidationError("Prompt muito curto (mínimo 3 caracteres)")
  }
  if (value.length > 2000) {
    throw new ValidationError("Prompt muito longo (máximo 2000 caracteres)")
  }
  return value.trim()
}

export function validateActivityType(value: unknown): "student" | "teacher_support" {
  if (value === "teacher_support") return "teacher_support"
  return "student"
}

interface ActivityElements {
  header: boolean
  title: boolean
  instructions: boolean
  illustrations: boolean
  bncc: boolean
}

export function validateElements(value: unknown): ActivityElements {
  const defaults: ActivityElements = {
    header: true,
    title: true,
    instructions: true,
    illustrations: true,
    bncc: true,
  }
  if (!value || typeof value !== "object" || Array.isArray(value)) return defaults
  const e = value as Record<string, unknown>
  return {
    header: typeof e.header === "boolean" ? e.header : defaults.header,
    title: typeof e.title === "boolean" ? e.title : defaults.title,
    instructions: typeof e.instructions === "boolean" ? e.instructions : defaults.instructions,
    illustrations: typeof e.illustrations === "boolean" ? e.illustrations : defaults.illustrations,
    bncc: typeof e.bncc === "boolean" ? e.bncc : defaults.bncc,
  }
}

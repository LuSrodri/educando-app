/**
 * Generates the full semantic slug for an activity URL.
 * Format: {first-6-words-of-prompt}-{last-block-of-uuid}
 * Example: "exercicio-de-matematica-para-alunos-do-446655440000"
 */
export function generateSemanticSlug(originalPrompt: string, id: string): string {
  const words = originalPrompt
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove diacritics
    .replace(/[^a-z0-9\s]/g, "")    // remove special chars
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 6)

  const wordSlug = words.join("-")
  const idSuffix = id.split("-")[4] ?? id.replace(/-/g, "").slice(-12)

  return `${wordSlug}-${idSuffix}`
}

/**
 * Returns true if the string is a valid UUID v4.
 */
export function isUUID(str: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str)
}

/**
 * Extracts the last 12 hex chars from a semantic slug.
 * These correspond to the DB semantic_slug column (last UUID block).
 */
export function extractIdSuffixFromSlug(slug: string): string | null {
  const match = slug.match(/([0-9a-f]{12})$/i)
  return match ? match[1] : null
}

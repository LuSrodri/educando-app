/**
 * Generates the slug for a material URL.
 * Format: {normalized-theme}-{last-block-of-uuid}
 * Example: "matematica-tabuada-do-7-446655440000"
 */
export function generateMaterialSlug(theme: string | null | undefined, id: string): string {
  const words = (theme ?? "material")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove diacritics
    .replace(/[^a-z0-9\s-]/g, " ")    // keep letters/digits/hyphens
    .replace(/-+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 6)

  const wordSlug = words.join("-") || "material"
  const idSuffix = id.split("-")[4] ?? id.replace(/-/g, "").slice(-12)

  return `${wordSlug}-${idSuffix}`
}

/** @deprecated use generateMaterialSlug */
export function generateSemanticSlug(_text: string, id: string): string {
  return generateMaterialSlug(_text, id)
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

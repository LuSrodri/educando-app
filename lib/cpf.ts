/**
 * Validação local de CPF brasileiro com checksum Mod 11 dos dois dígitos
 * verificadores.
 *
 * Em test mode, Stripe aceita `00000000000` como tax_id válido — esse caso
 * é coberto pela função `isStripeTestCpf` abaixo. Use `isCpfValid` em
 * produção e `isCpfAcceptable` no checkout (que aceita ambos).
 */

export function sanitizeCpf(input: string): string {
  return input.replace(/\D+/g, "")
}

export function formatCpf(input: string): string {
  const digits = sanitizeCpf(input).slice(0, 11)
  const parts: string[] = []
  if (digits.length > 0) parts.push(digits.slice(0, 3))
  if (digits.length > 3) parts.push(digits.slice(3, 6))
  if (digits.length > 6) parts.push(digits.slice(6, 9))
  let formatted = parts.join(".")
  if (digits.length > 9) formatted += "-" + digits.slice(9, 11)
  return formatted
}

export function isStripeTestCpf(cpf: string): boolean {
  return sanitizeCpf(cpf) === "00000000000"
}

export function isCpfValid(input: string): boolean {
  const cpf = sanitizeCpf(input)
  if (cpf.length !== 11) return false
  // Rejeita sequências triviais (todos iguais), que passariam no Mod 11.
  if (/^(\d)\1{10}$/.test(cpf)) return false

  const digits = cpf.split("").map(Number)
  for (const factorStart of [10, 11]) {
    let sum = 0
    for (let i = 0; i < factorStart - 1; i++) {
      sum += digits[i] * (factorStart - i)
    }
    const expected = (sum * 10) % 11 % 10
    if (digits[factorStart - 1] !== expected) return false
  }
  return true
}

/** Aceita CPF válido OU o test CPF da Stripe (00000000000). */
export function isCpfAcceptable(input: string): boolean {
  return isStripeTestCpf(input) || isCpfValid(input)
}

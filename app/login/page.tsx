import { redirect } from "next/navigation"

function safeNext(value: string | undefined) {
  if (!value) return undefined
  if (!value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) return undefined
  return value
}

interface PageProps {
  searchParams: Promise<{ next?: string }>
}

export default async function LoginPage({ searchParams }: PageProps) {
  const params = await searchParams
  const next = safeNext(params.next)

  if (next) {
    redirect(`/criar?login=1&next=${encodeURIComponent(next)}`)
  }
  redirect("/criar?login=1")
}

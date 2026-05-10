import { redirect } from "next/navigation"

interface PageProps {
  params: Promise<{ packCode: string }>
}

export default async function ComprarPage({ params }: PageProps) {
  const { packCode } = await params
  redirect(`/criar?creditos=1&pack=${encodeURIComponent(packCode)}`)
}

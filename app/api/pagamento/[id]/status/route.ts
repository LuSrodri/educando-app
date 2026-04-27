import { NextResponse, type NextRequest } from "next/server"
import { createSSRServerClient } from "@/lib/supabase/ssr-server"

interface Params {
  params: Promise<{ id: string }>
}

export async function GET(_request: NextRequest, { params }: Params) {
  const { id } = await params
  const supabase = await createSSRServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 })

  const { data, error } = await supabase
    .from("payment_intents")
    .select("status, paid_at, expires_at")
    .eq("id", id)
    .maybeSingle()

  if (error) return NextResponse.json({ error: "db_error" }, { status: 500 })
  if (!data) return NextResponse.json({ error: "not_found" }, { status: 404 })

  const response = NextResponse.json(data)
  response.headers.set("Cache-Control", "no-store")
  return response
}

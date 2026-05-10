import { NextResponse } from "next/server"
import { getCurrentUser, createSSRServerClient } from "@/lib/supabase/ssr-server"

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 })

  const supabase = await createSSRServerClient()
  const { data } = await supabase.rpc("current_credit_balance", { p_user_id: user.id })

  const response = NextResponse.json({ balance: (data as number | null) ?? 0 })
  response.headers.set("Cache-Control", "no-store")
  return response
}

"use server"

import { redirect } from "next/navigation"
import { createSSRServerClient } from "@/lib/supabase/ssr-server"

export async function signOutAction() {
  const supabase = await createSSRServerClient()
  await supabase.auth.signOut()
  redirect("/")
}

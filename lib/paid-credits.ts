import { createServerClient } from "@/lib/supabase/server"

export async function getPaidBalance(browserId: string): Promise<number> {
  const supabase = createServerClient()
  const { data } = await supabase
    .from("paid_credits")
    .select("balance")
    .eq("browser_id", browserId)
    .single()
  return data?.balance ?? 0
}

export async function hasPaidCredits(browserId: string): Promise<boolean> {
  const balance = await getPaidBalance(browserId)
  return balance > 0
}

export async function decrementPaidCredits(browserId: string): Promise<number> {
  const supabase = createServerClient()
  const { data, error } = await supabase.rpc("decrement_paid_credits", {
    p_browser_id: browserId,
  })
  if (error) {
    throw new Error("insufficient_paid_credits")
  }
  return data as number
}

export async function grantPaidCredits(browserId: string, amount: number): Promise<void> {
  const supabase = createServerClient()

  // Read current row (if any)
  const { data: existing } = await supabase
    .from("paid_credits")
    .select("balance, total_bought")
    .eq("browser_id", browserId)
    .single()

  const newBalance = (existing?.balance ?? 0) + amount
  const newTotal = (existing?.total_bought ?? 0) + amount

  const { error } = await supabase.from("paid_credits").upsert(
    {
      browser_id: browserId,
      balance: newBalance,
      total_bought: newTotal,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "browser_id" }
  )

  if (error) {
    console.error("Error granting paid credits:", error)
    throw new Error("Failed to grant paid credits")
  }
}

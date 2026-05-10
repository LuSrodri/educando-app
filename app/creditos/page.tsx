import { redirect } from "next/navigation"

export default function CreditosPage() {
  redirect("/criar?creditos=1")
}

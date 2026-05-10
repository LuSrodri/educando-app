import { redirect } from "next/navigation"

export default function PagamentoPage() {
  redirect("/criar?creditos=1")
}

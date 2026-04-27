"use client"

import { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Sparkles, BookOpen, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

type ActivityType = "activity" | "support_material"

type Stage =
  | "idle"
  | "searching"
  | "enriching"
  | "generating_spec"
  | "generating_image"
  | "saving"
  | "done"
  | "error"

const STAGE_LABELS: Record<Stage, string> = {
  idle: "",
  searching: "Pesquisando referências pedagógicas…",
  enriching: "Analisando conteúdo especializado…",
  generating_spec: "Elaborando a estrutura da ficha…",
  generating_image: "Gerando a ficha (pode levar ~40s)…",
  saving: "Salvando na sua conta…",
  done: "Concluído!",
  error: "",
}

const STAGE_ORDER: Stage[] = [
  "searching",
  "enriching",
  "generating_spec",
  "generating_image",
  "saving",
  "done",
]

export function GenerationForm({
  balance,
  initialTheme = "",
}: {
  balance: number
  initialTheme?: string
}) {
  const router = useRouter()
  const [theme, setTheme] = useState(initialTheme)
  const [type, setType] = useState<ActivityType>("activity")
  const [stage, setStage] = useState<Stage>("idle")
  const [errorMsg, setErrorMsg] = useState("")
  const readerRef = useRef<ReadableStreamDefaultReader<Uint8Array> | null>(null)

  const isRunning = stage !== "idle" && stage !== "done" && stage !== "error"
  const canSubmit = theme.trim().length >= 3 && !isRunning && balance > 0

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit) return

    setStage("searching")
    setErrorMsg("")

    try {
      const res = await fetch("/api/gerar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ theme: theme.trim(), type }),
      })

      if (!res.body) throw new Error("No stream body")
      const reader = res.body.getReader()
      readerRef.current = reader
      const textDecoder = new TextDecoder()
      let buffer = ""

      while (true) {
        const { value, done } = await reader.read()
        if (done) break
        buffer += textDecoder.decode(value, { stream: true })

        // Parse SSE events (separated by \n\n)
        const parts = buffer.split("\n\n")
        buffer = parts.pop() ?? ""

        for (const part of parts) {
          const line = part.startsWith("data: ") ? part.slice(6) : part
          if (!line) continue
          try {
            const event = JSON.parse(line) as { stage: Stage; slug?: string; message?: string }
            if (event.stage === "done" && event.slug) {
              setStage("done")
              setTimeout(() => router.push(`/material/${event.slug}`), 600)
            } else if (event.stage === "error") {
              setStage("error")
              setErrorMsg(event.message ?? "Algo deu errado. Tente novamente.")
            } else {
              setStage(event.stage)
            }
          } catch {
            // Ignore malformed chunks
          }
        }
      }
    } catch (err) {
      setStage("error")
      setErrorMsg((err as Error).message ?? "Erro de rede. Tente novamente.")
    }
  }

  const currentStageIndex = STAGE_ORDER.indexOf(stage)

  return (
    <div className="space-y-8">
      {balance <= 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-center">
          <p className="text-sm font-medium text-amber-900">
            Você não tem créditos disponíveis.
          </p>
          <Button
            asChild
            size="sm"
            className="mt-3 bg-amber-600 text-white hover:bg-amber-700"
          >
            <a href="/sejamembro">Comprar créditos</a>
          </Button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-800">
            Tema ou assunto da atividade
          </label>
          <Textarea
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
            placeholder="Ex.: Frações para o 4º ano, Consciência fonológica, Sistema solar, Animais do Cerrado…"
            rows={3}
            disabled={isRunning}
            className="resize-none bg-white"
            maxLength={200}
          />
          <p className="mt-1 text-right text-xs text-gray-400">{theme.length}/200</p>
        </div>

        <div>
          <p className="mb-3 text-sm font-medium text-gray-800">Tipo de material</p>
          <div className="grid grid-cols-2 gap-3">
            {(
              [
                { value: "activity", label: "Atividade", desc: "Ficha com exercícios e cabeçalho para o aluno", icon: BookOpen },
                { value: "support_material", label: "Material de Apoio", desc: "Resumo, mapa mental ou guia de estudo", icon: FileText },
              ] as const
            ).map(({ value, label, desc, icon: Icon }) => (
              <button
                key={value}
                type="button"
                onClick={() => setType(value)}
                disabled={isRunning}
                className={`flex flex-col gap-1 rounded-xl border-2 p-4 text-left transition-all ${
                  type === value
                    ? "border-amber-500 bg-amber-50 ring-2 ring-amber-200"
                    : "border-gray-200 bg-white hover:border-amber-200"
                }`}
              >
                <Icon className={`h-5 w-5 ${type === value ? "text-amber-600" : "text-gray-500"}`} />
                <span className="text-sm font-semibold text-gray-900">{label}</span>
                <span className="text-xs text-gray-500">{desc}</span>
              </button>
            ))}
          </div>
        </div>

        <Button
          type="submit"
          disabled={!canSubmit}
          size="lg"
          className="w-full bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-50"
        >
          {isRunning ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Gerando…
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              Gerar atividade — 1 crédito
            </>
          )}
        </Button>
      </form>

      {isRunning && (
        <div className="rounded-2xl border border-amber-100 bg-amber-50/50 p-6">
          <p className="mb-4 text-sm font-medium text-amber-900">
            {STAGE_LABELS[stage]}
          </p>
          <div className="space-y-2">
            {STAGE_ORDER.filter((s) => s !== "done").map((s, i) => {
              const isPast = i < currentStageIndex
              const isCurrent = i === currentStageIndex
              return (
                <div key={s} className="flex items-center gap-3">
                  <div
                    className={`h-2 w-2 shrink-0 rounded-full transition-colors ${
                      isPast
                        ? "bg-emerald-500"
                        : isCurrent
                          ? "animate-pulse bg-amber-500"
                          : "bg-gray-200"
                    }`}
                  />
                  <span
                    className={`text-xs ${
                      isCurrent ? "font-medium text-amber-800" : isPast ? "text-gray-500" : "text-gray-400"
                    }`}
                  >
                    {STAGE_LABELS[s]}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {stage === "error" && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4">
          <p className="text-sm font-medium text-red-900">Ops — algo deu errado</p>
          <p className="mt-1 text-sm text-red-700">{errorMsg}</p>
          <p className="mt-2 text-xs text-red-600">
            Seu crédito não foi debitado (o débito só ocorre após a geração bem-sucedida).
          </p>
          <Button
            size="sm"
            variant="outline"
            className="mt-3"
            onClick={() => setStage("idle")}
          >
            Tentar novamente
          </Button>
        </div>
      )}
    </div>
  )
}

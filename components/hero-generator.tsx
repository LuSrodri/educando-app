"use client"

import { useState, useRef, useEffect, useImperativeHandle, forwardRef } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Loader2,
  Sparkles,
  Download,
  Printer,
  RefreshCw,
  Share2,
  BookOpen,
  Zap,
  ChevronDown,
  ChevronUp,
  Info,
  CheckCircle,
  VenetianMask,
  Lock,
  CreditCard,
} from "lucide-react"
import { track } from "@vercel/analytics"
import { ShareModal } from "@/components/share-modal"
import { GenerationConsentModal } from "@/components/generation-consent-modal"
import { PaywallModal } from "@/components/paywall-modal"
import { PinterestSaveButton } from "@/components/pinterest-save-button"
import { useBrowserId } from "@/hooks/useBrowserId"
import { useCredits } from "@/hooks/useCredits"
import type { Activity } from "@/lib/supabase/types"
import { getActivityImageUrl } from "@/lib/image-utils"

const GENERATION_CONSENT_KEY = "educando_generation_consent"

interface ActivityElements {
  header: boolean
  title: boolean
  instructions: boolean
  illustrations: boolean
  bncc: boolean
}

type ActivityType = "student" | "teacher_support"

export interface HeroGeneratorRef {
  setPromptValue: (value: string) => void
  focusPrompt: () => void
}

export const HeroGenerator = forwardRef<HeroGeneratorRef>(function HeroGenerator(_, ref) {
  const [prompt, setPrompt] = useState("")
  const [generatedImage, setGeneratedImage] = useState<string | null>(null)
  const [currentActivity, setCurrentActivity] = useState<Activity | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationStatus, setGenerationStatus] = useState<string | null>(null)
  const [statusPhase, setStatusPhase] = useState<"improving" | "generating">("improving")
  const [error, setError] = useState<string | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const resultRef = useRef<HTMLDivElement>(null)

  const [showShareModal, setShowShareModal] = useState(false)
  const [showConsentModal, setShowConsentModal] = useState(false)
  const [showPaywallModal, setShowPaywallModal] = useState(false)

  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false)
  const [activityType, setActivityType] = useState<ActivityType>("student")
  const [elements, setElements] = useState<ActivityElements>({
    header: true,
    title: true,
    instructions: true,
    illustrations: true,
    bncc: true,
  })

  const { browserId, isLoading: browserLoading } = useBrowserId()
  const {
    remainingFree,
    paidBalance,
    hasPaidCredits,
    canGenerate,
    freeLimit,
    refresh: refreshCredits,
  } = useCredits(browserId)

  useImperativeHandle(ref, () => ({
    setPromptValue: (value: string) => {
      setPrompt(value)
      setGeneratedImage(null)
      setCurrentActivity(null)
      setError(null)
    },
    focusPrompt: () => {
      setTimeout(() => {
        textareaRef.current?.focus()
      }, 100)
    },
  }))

  const improvingMessages = [
    "Aprimorando seu prompt com IA...",
    "Analisando o contexto pedagógico...",
    "Alinhando com a BNCC...",
  ]

  const generatingMessages = [
    "Gerando sua atividade...",
    "Criando os elementos visuais...",
    "Organizando o layout A4...",
    "Adicionando ilustrações educativas...",
    "Preparando material para impressão...",
    "Polindo a atividade...",
    "Quase pronto...",
  ]

  useEffect(() => {
    if (!isGenerating) return

    const messages = statusPhase === "improving" ? improvingMessages : generatingMessages
    let currentIndex = 0

    setGenerationStatus(messages[0])

    const interval = setInterval(() => {
      currentIndex = (currentIndex + 1) % messages.length
      setGenerationStatus(messages[currentIndex])
    }, 2500)

    return () => clearInterval(interval)
  }, [isGenerating, statusPhase])

  useEffect(() => {
    if (generatedImage && resultRef.current) {
      if (window.innerWidth < 1024) {
        resultRef.current.scrollIntoView({ behavior: "smooth", block: "start" })
      }
    }
  }, [generatedImage])

  const handleGenerateClick = () => {
    if (!prompt.trim() || !browserId) return
    if (!canGenerate) {
      track("free_limit_reached", { source: "generate_button" })
      setShowPaywallModal(true)
      return
    }
    if (!localStorage.getItem(GENERATION_CONSENT_KEY)) {
      setShowConsentModal(true)
      return
    }
    generateActivity()
  }

  const handleConsentAccept = () => {
    localStorage.setItem(GENERATION_CONSENT_KEY, "true")
    setShowConsentModal(false)
    generateActivity()
  }

  const generateActivity = async () => {
    if (!prompt.trim() || !browserId) return

    setIsGenerating(true)
    setError(null)
    setGeneratedImage(null)
    setCurrentActivity(null)
    setStatusPhase("improving")

    try {
      const improveResponse = await fetch("/api/improve-prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          activityType,
          elements: activityType === "student" ? elements : undefined,
          browserId,
        }),
      })

      if (!improveResponse.ok) {
        const improveError = await improveResponse.json()
        if (improveError.isPaywall) {
          track("free_limit_reached", { source: "api_403_improve" })
          setShowPaywallModal(true)
          return
        }
        if (improveError.isSafetyBlock) {
          setError("Não foi possível processar sua solicitação. Tente novamente mais tarde.")
          return
        }
        throw new Error("Erro ao melhorar prompt")
      }

      const improveData = await improveResponse.json()
      const finalPrompt = improveData.improvedPrompt || prompt

      setStatusPhase("generating")

      const response = await fetch("/api/generate-activity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          improvedPrompt: finalPrompt,
          browserId,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        if (response.status === 403 && errorData.isPaywall) {
          track("free_limit_reached", { source: "api_403_generate" })
          setShowPaywallModal(true)
          return
        }
        throw new Error(errorData.error || "Erro ao gerar atividade")
      }

      const data = await response.json()
      if (data.image) {
        setGeneratedImage(`data:${data.image.mediaType};base64,${data.image.base64}`)
        setCurrentActivity(data.activity)
        track("activity_processed", {
          activity_type: activityType,
          is_paid: data.activity?.is_paid ?? false,
        })
        refreshCredits()
      } else {
        throw new Error("Nenhuma imagem foi gerada")
      }
    } catch (err) {
      setError("Erro ao gerar a atividade. Tente novamente.")
    } finally {
      setIsGenerating(false)
      setGenerationStatus(null)
    }
  }

  const downloadImage = () => {
    if (!generatedImage) return
    const link = document.createElement("a")
    link.href = generatedImage
    link.download = "atividade-escolar.png"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const printImage = () => {
    if (!generatedImage) return
    const printWindow = window.open("", "_blank")
    if (!printWindow) return
    const doc = printWindow.document
    const style = doc.createElement("style")
    style.textContent =
      "body{margin:0;display:flex;justify-content:center;align-items:center;min-height:100vh}" +
      "img{max-width:100%;height:auto}"
    doc.head.appendChild(style)
    doc.title = "Atividade Escolar"
    const img = doc.createElement("img")
    img.src = generatedImage
    img.addEventListener("load", () => { printWindow.print(); printWindow.close() })
    doc.body.appendChild(img)
  }

  const regenerate = () => {
    setGeneratedImage(null)
    setCurrentActivity(null)
    generateActivity()
  }

  const suggestions = [
    "Atividade de alfabetização com as vogais",
    "Tabuada divertida do 7",
    "Interpretação de texto para 4º ano",
    "Ciências: ciclo da água para 3º ano",
  ]

  return (
    <>
      <section id="gerador" className="bg-gradient-to-b from-amber-50 via-amber-50/30 to-background">
        <div className="container mx-auto px-4 py-6 lg:py-10">
          {/* Header */}
          <header className="flex flex-col items-center text-center max-w-3xl mx-auto mb-8">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-2 leading-tight font-heading">
              Crie atividades escolares em <br /><span className="text-amber-600">30 segundos</span>
            </h1>
            <p className="text-base text-gray-600 max-w-xl">
              Atividades pedagógicas alinhadas à BNCC, prontas para imprimir.
              <br />
              <span className="text-amber-600 font-semibold"> 1 atividade grátis para começar.</span>
            </p>
          </header>

          {/* Main layout: side-by-side on desktop */}
          <div className="flex flex-col lg:flex-row gap-6 max-w-6xl mx-auto h-auto">
            {/* Left column: prompt + controls */}
            <div className="flex-1 min-w-0 space-y-4">
              {/* Prompt input */}
              <Card className="shadow-lg border-2 border-amber-400 bg-white">
                <CardContent className="p-4 md:p-5 space-y-4">
                  <label htmlFor="activity-prompt" className="sr-only">
                    Descreva a atividade que deseja gerar
                  </label>
                  <Textarea
                    id="activity-prompt"
                    ref={textareaRef}
                    placeholder="Descreva a atividade que deseja gerar... Ex: Atividade de matemática sobre frações para 5º ano"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="min-h-[100px] text-base text-gray-900 placeholder:text-gray-400 resize-none border-2 border-amber-200 focus:border-amber-500 focus:ring-amber-500 bg-white"
                    disabled={isGenerating || browserLoading}
                    aria-label="Descreva a atividade que deseja gerar"
                    maxLength={2000}
                  />

                  {/* Suggestion pills */}
                  <div className="flex flex-wrap gap-2">
                    {suggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        onClick={() => setPrompt(suggestion)}
                        className="text-xs bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-full hover:bg-amber-100 hover:border-amber-300 transition-colors text-amber-800 font-medium cursor-pointer"
                        disabled={isGenerating}
                        aria-label={`Usar sugestão: ${suggestion}`}
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>

                  {/* Advanced options */}
                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
                      className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors cursor-pointer"
                    >
                      {showAdvancedOptions ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      <span>Opções avançadas</span>
                    </button>

                    {showAdvancedOptions && (
                      <div className="bg-gray-50 rounded-lg p-3 space-y-3 border border-gray-200">
                        {/* Activity type */}
                        <div className="space-y-2">
                          <p className="text-xs font-medium text-gray-600">Tipo de Material</p>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => setActivityType("student")}
                              className={`flex-1 px-3 py-2 text-xs rounded-lg border transition-colors cursor-pointer ${activityType === "student"
                                  ? "bg-amber-100 border-amber-400 text-amber-800"
                                  : "bg-white border-gray-200 text-gray-700 hover:border-amber-300"
                                }`}
                            >
                              <span className="font-medium">Atividade ao Aluno</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setActivityType("teacher_support")}
                              className={`flex-1 px-3 py-2 text-xs rounded-lg border transition-colors cursor-pointer ${activityType === "teacher_support"
                                  ? "bg-amber-100 border-amber-400 text-amber-800"
                                  : "bg-white border-gray-200 text-gray-700 hover:border-amber-300"
                                }`}
                            >
                              <span className="font-medium">Material de Apoio</span>
                            </button>
                          </div>
                        </div>

                        {/* Elements - only for student activities */}
                        {activityType === "student" && (
                          <div className="space-y-2">
                            <p className="text-xs text-gray-500 flex items-center gap-1">
                              <Info className="w-3 h-3" />
                              Elementos a incluir na atividade
                            </p>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                              {[
                                { key: "header" as const, label: "Cabeçalho" },
                                { key: "title" as const, label: "Título" },
                                { key: "instructions" as const, label: "Enunciado" },
                                { key: "illustrations" as const, label: "Ilustrações" },
                                { key: "bncc" as const, label: "Ref. BNCC" },
                              ].map(({ key, label }) => (
                                <label key={key} className="flex items-center gap-2 cursor-pointer">
                                  <Checkbox
                                    checked={elements[key]}
                                    onCheckedChange={(checked) =>
                                      setElements((prev) => ({ ...prev, [key]: !!checked }))
                                    }
                                  />
                                  <span className="text-xs text-gray-700">{label}</span>
                                </label>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Usage display */}
                  <div className="space-y-1.5">
                    {hasPaidCredits ? (
                      // Paid credits display
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 flex items-center gap-1.5">
                          <CreditCard className="w-4 h-4 text-amber-600" />
                          <span>
                            <span className="font-bold text-amber-600">{paidBalance}</span>{" "}
                            {paidBalance === 1 ? "crédito pago disponível" : "créditos pagos disponíveis"}
                          </span>
                        </span>
                        {remainingFree > 0 && (
                          <span className="text-xs text-gray-400">
                            +{remainingFree} grátis
                          </span>
                        )}
                      </div>
                    ) : (
                      // Free credits display
                      <>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">
                            <span
                              className={`font-bold ${remainingFree >= 3
                                  ? "text-green-600"
                                  : remainingFree >= 2
                                    ? "text-amber-600"
                                    : "text-red-600"
                                }`}
                            >
                              {remainingFree}
                            </span>{" "}
                            atividades gratuitas para gerar agora
                          </span>
                        </div>
                        <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden border border-gray-200">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ease-out ${remainingFree >= 3
                                ? "bg-gradient-to-r from-green-400 to-green-500"
                                : remainingFree >= 2
                                  ? "bg-gradient-to-r from-amber-400 to-amber-500"
                                  : "bg-gradient-to-r from-red-400 to-red-500"
                              }`}
                            style={{ width: `${freeLimit > 0 ? (remainingFree / freeLimit) * 100 : 0}%` }}
                          />
                        </div>
                      </>
                    )}
                  </div>

                  {/* Generate button */}
                  {canGenerate ? (
                    <Button
                      onClick={handleGenerateClick}
                      disabled={!prompt.trim() || isGenerating || browserLoading}
                      className="w-full bg-amber-600 hover:bg-amber-700 text-white h-auto py-3.5 text-base font-bold shadow-lg hover:shadow-xl transition-all cursor-pointer"
                    >
                      {isGenerating ? (
                        <span className="flex items-center justify-center gap-2">
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span className="text-center">{generationStatus}</span>
                        </span>
                      ) : browserLoading ? (
                        <span className="flex items-center justify-center gap-2">
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span>Carregando...</span>
                        </span>
                      ) : (
                        <span className="flex items-center justify-center gap-2">
                          <Sparkles className="w-5 h-5" />
                          <span>Gerar Atividade</span>
                        </span>
                      )}
                    </Button>
                  ) : (
                    <Button
                      onClick={() => { track("free_limit_reached", { source: "locked_button" }); setShowPaywallModal(true) }}
                      disabled={browserLoading}
                      className="w-full bg-gray-900 hover:bg-gray-800 text-white h-auto py-3.5 text-base font-bold shadow-lg hover:shadow-xl transition-all cursor-pointer"
                    >
                      <span className="flex items-center justify-center gap-2">
                        <Lock className="w-5 h-5" />
                        <span>Comprar mais atividades</span>
                      </span>
                    </Button>
                  )}

                  {/* Error */}
                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <p className="text-sm text-red-700">{error}</p>
                    </div>
                  )}

                  <p className="text-center text-sm text-gray-400">
                    <strong className="text-sm text-amber-600">Dica:</strong>&nbsp;
                    Module seu pedido de acordo para garantir que tudo caiba bem no layout de uma página A4.
                  </p>
                </CardContent>
              </Card>

              {/* Mini features */}
              <div className="flex flex-wrap justify-center gap-4 text-xs text-gray-500">
                <div className="flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-amber-600" />
                  <span>Alfabetização ao 9º ano</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-600" />
                  <span>Pronto em segundos</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Printer className="w-3.5 h-3.5 text-amber-600" />
                  <span>Formato A4</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5 text-amber-600" />
                  <span>BNCC</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <VenetianMask className="w-3.5 h-3.5 text-amber-600" />
                  <span>Sem Login</span>
                </div>
              </div>
            </div>

            {/* Right column: generated activity (desktop) / below (mobile) */}
            <div
              ref={resultRef}
              className={`lg:w-[480px] ${generatedImage ? "flex" : "hidden lg:flex"}`}
            >
              {generatedImage ? (
                <div className="lg:sticky lg:top-4 lg:overflow-y-auto rounded-xl border-2 border-green-400 bg-green-50 overflow-hidden">
                  <div className="p-3">
                    <img
                      src={generatedImage}
                      alt="Atividade gerada"
                      className="w-full h-auto rounded-lg shadow-md"
                    />
                  </div>

                  {/* Action buttons */}
                  <div className="border-t border-green-300 bg-white p-3">
                    <p className="text-sm font-bold text-green-800 mb-2">Atividade pronta!</p>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={downloadImage}
                        className="text-gray-700 border-gray-300 hover:bg-gray-50 cursor-pointer"
                      >
                        <Download className="w-4 h-4 mr-1.5" />
                        Baixar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={printImage}
                        className="text-gray-700 border-gray-300 hover:bg-gray-50 cursor-pointer"
                      >
                        <Printer className="w-4 h-4 mr-1.5" />
                        Imprimir
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setShowShareModal(true)}
                        className="text-pink-700 border-pink-300 hover:bg-pink-50 cursor-pointer"
                      >
                        <Share2 className="w-4 h-4 mr-1.5" />
                        Compartilhar
                      </Button>
                      {currentActivity && !currentActivity.is_paid && (
                        <PinterestSaveButton
                          activityUrl={`https://educando.app/atividade/${currentActivity.id}`}
                          imageUrl={`${getActivityImageUrl(currentActivity.image_path)}`}
                          description={`${currentActivity.improved_prompt}`}
                        />
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={regenerate}
                        disabled={isGenerating || !canGenerate}
                        className="text-gray-600 hover:text-gray-800 cursor-pointer"
                      >
                        <RefreshCw className="w-4 h-4 mr-1.5" />
                        Fazer novamente
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex-1 hidden lg:flex items-center justify-center border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50">
                  <div className="text-center text-gray-400">
                    <Sparkles className="w-10 h-10 mx-auto mb-2 opacity-60" />
                    <p className="text-lg opacity-60 uppercase font-extrabold text-center m-auto">Sua atividade aparecerá aqui</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {currentActivity && (
        <ShareModal
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          activityId={currentActivity.id}
          activityTitle={currentActivity.original_prompt}
          activityImage={generatedImage || undefined}
        />
      )}

      {showConsentModal && (
        <GenerationConsentModal
          onAccept={handleConsentAccept}
          onDecline={() => setShowConsentModal(false)}
          isPaid={hasPaidCredits}
        />
      )}

      {browserId && (
        <PaywallModal
          isOpen={showPaywallModal}
          onClose={() => setShowPaywallModal(false)}
          onSuccess={() => {
            refreshCredits()
            setShowPaywallModal(false)
            if (prompt.trim()) {
              generateActivity()
            }
          }}
          browserId={browserId}
        />
      )}
    </>
  )
})

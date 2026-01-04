"use client"

import { useState, useRef, useEffect, useImperativeHandle, forwardRef } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Loader2,
  Sparkles,
  Download,
  Printer,
  RefreshCw,
  Wand2,
  X,
  Share2,
  CheckCircle,
  BookOpen,
  Zap,
  VenetianMask,
  History,
} from "lucide-react"
import { PaymentModal } from "@/components/payment-modal"
import { EducationalLevelSelector } from "@/components/educational-level-selector"
import { useBrowserId } from "@/hooks/useBrowserId"
import { useCredits } from "@/hooks/useCredits"
import { FREE_DAILY_LIMIT } from "@/lib/session"
import { type EducationalLevelId, EDUCATIONAL_LEVELS } from "@/types/educational-levels"
import type { Activity } from "@/lib/supabase/types"
import Link from "next/link"

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
  const imageRef = useRef<HTMLImageElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const resultRef = useRef<HTMLDivElement>(null)

  const [isEditing, setIsEditing] = useState(false)
  const [editPrompt, setEditPrompt] = useState("")
  const [isApplyingEdit, setIsApplyingEdit] = useState(false)

  const [showPaymentModal, setShowPaymentModal] = useState(false)

  // Educational level state
  const [educationalLevel, setEducationalLevel] = useState<EducationalLevelId>("fundamental_1")
  const [grade, setGrade] = useState("1")

  // Use new hooks
  const { browserId, isLoading: browserLoading } = useBrowserId()
  const { remainingFree, extraCredits, canGenerate, refresh: refreshCredits } = useCredits(browserId)

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
      }, 300)
    },
  }))

  const improvingMessages = [
    "Aprimorando seu prompt com IA...",
    "Analisando o contexto pedagogico...",
    "Adaptando para o nivel escolar...",
    "Alinhando com a BNCC...",
  ]

  const generatingMessages = [
    "Gerando sua atividade...",
    "Criando os elementos visuais...",
    "Organizando o layout...",
    "Adicionando ilustracoes educativas...",
    "Incluindo referencia a BNCC...",
    "Preparando material para impressao...",
    "Finalizando a atividade...",
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
      resultRef.current.scrollIntoView({ behavior: "smooth", block: "center" })
    }
  }, [generatedImage])

  const handleEducationalLevelChange = (level: EducationalLevelId, selectedGrade: string) => {
    setEducationalLevel(level)
    setGrade(selectedGrade)
  }

  const generateActivity = async () => {
    if (!prompt.trim() || !browserId) return

    // Check if can generate
    if (!canGenerate) {
      setShowPaymentModal(true)
      return
    }

    setIsGenerating(true)
    setError(null)
    setGeneratedImage(null)
    setCurrentActivity(null)
    setIsEditing(false)
    setEditPrompt("")
    setStatusPhase("improving")

    try {
      const improveResponse = await fetch("/api/improve-prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          educationalLevel,
          grade,
        }),
      })

      if (!improveResponse.ok) throw new Error("Erro ao melhorar prompt")

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
          educationalLevel,
          grade,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        if (response.status === 403) {
          setShowPaymentModal(true)
          return
        }
        throw new Error(errorData.error || "Erro ao gerar atividade")
      }

      const data = await response.json()
      if (data.image) {
        setGeneratedImage(`data:${data.image.mediaType};base64,${data.image.base64}`)
        setCurrentActivity(data.activity)
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

  const applyEdit = async () => {
    if (!editPrompt.trim() || !generatedImage || !browserId) return

    setIsApplyingEdit(true)
    setError(null)

    try {
      const [header, base64Data] = generatedImage.split(",")
      const mediaType = header.match(/data:(.*);base64/)?.[1] || "image/png"

      const response = await fetch("/api/edit-activity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          editPrompt,
          currentImage: base64Data,
          mediaType,
          browserId,
          parentActivityId: currentActivity?.id,
        }),
      })

      if (!response.ok) throw new Error("Erro ao editar atividade")

      const data = await response.json()
      if (data.image) {
        setGeneratedImage(`data:${data.image.mediaType};base64,${data.image.base64}`)
        if (data.activity) {
          setCurrentActivity(data.activity)
        }
        setEditPrompt("")
        setIsEditing(false)
      } else {
        throw new Error("Erro ao aplicar edicao")
      }
    } catch (err) {
      setError("Erro ao editar a atividade. Tente novamente.")
    } finally {
      setIsApplyingEdit(false)
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
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Atividade Escolar</title>
            <style>
              body { margin: 0; display: flex; justify-content: center; align-items: center; min-height: 100vh; }
              img { max-width: 100%; height: auto; }
            </style>
          </head>
          <body>
            <img src="${generatedImage}" onload="window.print(); window.close();" />
          </body>
        </html>
      `)
      printWindow.document.close()
    }
  }

  const shareImage = async () => {
    if (!generatedImage) return

    const shareText = "Criei essa atividade em 30 segundos! Professores, usem: https://educando.app"

    try {
      const response = await fetch(generatedImage)
      const blob = await response.blob()
      const file = new File([blob], "atividade-escolar.png", { type: "image/png" })

      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: "Atividade Escolar - educando.app",
          text: shareText,
          files: [file],
        })
      } else {
        await navigator.clipboard.writeText(shareText)
        alert("Link copiado! Cole nas suas redes sociais junto com a imagem baixada.")
        downloadImage()
      }
    } catch (err) {
      await navigator.clipboard.writeText(shareText)
      alert("Link copiado! Cole nas suas redes sociais junto com a imagem baixada.")
    }
  }

  const regenerate = () => {
    if (!canGenerate) {
      setShowPaymentModal(true)
      return
    }
    setGeneratedImage(null)
    setCurrentActivity(null)
    setIsEditing(false)
    setEditPrompt("")
    generateActivity()
  }

  const editSuggestions = ["Remover a imagem do canto", "Adicionar mais linhas", "Trocar o titulo", "Aumentar espacos"]

  // Dynamic suggestions based on educational level
  const getSuggestions = () => {
    switch (educationalLevel) {
      case "alfabetizacao":
        return [
          "Reconhecimento de letras do alfabeto",
          "Contagem de 1 a 10 com desenhos",
          "Ligar imagens as palavras",
          "Pintar as vogais",
        ]
      case "fundamental_1":
        return [
          `Alfabetizacao fonetica para ${grade}o ano`,
          `Fluencia leitora para ${grade}o ano`,
          `Tabuada divertida para ${grade}o ano`,
          "Problemas de adicao com desenhos",
        ]
      case "fundamental_2":
        return [
          `Interpretacao de texto para ${grade}o ano`,
          `Equacoes do 1o grau para ${grade}o ano`,
          `Ciencias: sistema solar para ${grade}o ano`,
          `Historia do Brasil para ${grade}o ano`,
        ]
      default:
        return [
          "Alfabetizacao fonetica para 1o ano",
          "Fluencia leitora para 3o ano",
          "Tabuada divertida para 2o ano",
          "Problemas de adicao com desenhos",
        ]
    }
  }

  return (
    <>
      <section
        id="gerador"
        className="relative overflow-hidden bg-gradient-to-b from-amber-50 via-amber-50/50 to-background py-10 md:py-16"
      >
        <div className="absolute inset-0 bg-[url('/subtle-grid-pattern.png')] opacity-5" />

        <div className="container mx-auto px-4 relative">
          {/* Header */}
          <header className="flex flex-col items-center text-center max-w-3xl mx-auto mb-8">
            <BookOpen className="w-12 h-12 text-amber-600 mb-4" />

            <h1 className="text-3xl md:text-5xl font-bold text-gray-900 mb-3 leading-tight">
              Crie atividades escolares em <br/><span className="text-amber-600">30 segundos</span>
            </h1>

            <p className="text-base md:text-lg text-gray-600 max-w-xl">
              Digite o tema, clique em{" "}
              <span className="text-amber-600 inline-flex items-center gap-1 text-sm"><Sparkles className="w-3 h-3 inline" /> Gerar Atividade</span> e crie
              atividades pedagogicas prontas para imprimir.
            </p>
          </header>

          {/* Formulario principal - destaque visual */}
          <div className="max-w-2xl mx-auto">
            <Card className="shadow-2xl border-2 border-amber-400 bg-white backdrop-blur">
              <CardContent className="p-5 md:p-6">
                <div className="space-y-4">
                  {/* Educational Level Selector */}
                  <EducationalLevelSelector
                    defaultLevel={educationalLevel}
                    defaultGrade={grade}
                    onChange={handleEducationalLevelChange}
                  />

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-700 font-medium">
                        <span
                          className={`font-bold ${
                            remainingFree === 3
                              ? "text-green-600"
                              : remainingFree === 2
                                ? "text-amber-600"
                                : remainingFree <= 1
                                  ? "text-red-600"
                                  : "text-gray-600"
                          }`}
                        >
                          {remainingFree}
                        </span>{" "}
                        atividades gratis hoje
                      </span>
                      <Link
                        href="/historico"
                        className="flex items-center gap-1 text-gray-500 hover:text-amber-600 transition-colors"
                      >
                        <History className="w-4 h-4" />
                        <span className="hidden sm:inline">Historico</span>
                      </Link>
                    </div>
                    <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden border border-gray-200">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ease-out ${
                          remainingFree === 3
                            ? "bg-gradient-to-r from-green-400 to-green-500"
                            : remainingFree === 2
                              ? "bg-gradient-to-r from-amber-400 to-amber-500"
                              : "bg-gradient-to-r from-red-400 to-red-500"
                        }`}
                        style={{ width: `${(remainingFree / FREE_DAILY_LIMIT) * 100}%` }}
                      />
                    </div>
                  </div>

                  {/* Input Area */}
                  <div>
                    <Textarea
                      ref={textareaRef}
                      placeholder={`Ex: Atividade de ${EDUCATIONAL_LEVELS[educationalLevel].name.toLowerCase()} para ${grade}o ano...`}
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      className="min-h-[100px] text-base text-gray-900 placeholder:text-gray-500 resize-none border-2 border-amber-300 focus:border-amber-500 focus:ring-amber-500 bg-white"
                      disabled={isGenerating || isApplyingEdit || browserLoading}
                    />
                  </div>

                  {/* Sugestoes rapidas */}
                  <div className="flex flex-wrap gap-2">
                    {getSuggestions().map((suggestion, index) => (
                      <button
                        key={index}
                        onClick={() => setPrompt(suggestion)}
                        className="text-xs bg-amber-100 border border-amber-300 px-3 py-1.5 rounded-full hover:bg-amber-200 hover:border-amber-400 transition-colors text-amber-900 font-medium"
                        disabled={isGenerating || isApplyingEdit}
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>

                  {/* Botao principal grande */}
                  <Button
                    onClick={generateActivity}
                    disabled={!prompt.trim() || isGenerating || isApplyingEdit || browserLoading}
                    className="w-full bg-amber-600 hover:bg-amber-700 text-white h-auto py-4 text-base md:text-lg font-bold shadow-lg hover:shadow-xl transition-all"
                  >
                    {isGenerating ? (
                      <span className="flex items-center justify-center flex-wrap gap-2">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span className="text-center">{generationStatus}</span>
                      </span>
                    ) : browserLoading ? (
                      <span className="flex items-center justify-center flex-wrap gap-2">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Carregando...</span>
                      </span>
                    ) : (
                      <span className="flex items-center justify-center flex-wrap gap-2">
                        <Sparkles className="w-5 h-5" />
                        <span>Gerar Atividade</span>
                      </span>
                    )}
                  </Button>

                  {/* Mensagem de creditos extras */}
                  {extraCredits > 0 && (
                    <div className="bg-green-50 border border-green-300 rounded-lg p-3 text-center">
                      <p className="text-sm text-green-800 font-medium">
                        Voce tem {extraCredits} credito{extraCredits > 1 ? "s" : ""} extra{extraCredits > 1 ? "s" : ""} disponivel{extraCredits > 1 ? "is" : ""}.
                      </p>
                    </div>
                  )}

                  {/* Error */}
                  {error && (
                    <div className="bg-red-50 border border-red-300 rounded-lg p-3">
                      <p className="text-sm text-red-800 font-medium">{error}</p>
                    </div>
                  )}

                  {/* Resultado */}
                  {generatedImage && (
                    <div
                      ref={resultRef}
                      className="border-2 border-green-400 rounded-xl bg-green-50 overflow-hidden mt-4"
                    >
                      <div className="grid md:grid-cols-[1fr,200px]">
                        {/* Imagem */}
                        <div className="p-4">
                          <img
                            ref={imageRef}
                            src={generatedImage || "/placeholder.svg"}
                            alt="Atividade gerada"
                            className="w-full h-auto rounded-lg shadow-md"
                          />
                        </div>

                        {/* Acoes */}
                        <div className="border-t md:border-t-0 md:border-l border-green-300 bg-white p-4 flex flex-col gap-2">
                          <p className="text-sm font-bold text-green-800 mb-2">Atividade pronta!</p>

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setIsEditing(!isEditing)}
                            className="justify-start text-blue-800 border-blue-300 hover:bg-blue-100 font-medium"
                          >
                            <Wand2 className="w-4 h-4 mr-2" />
                            Editar
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={downloadImage}
                            className="justify-start text-gray-800 border-gray-300 hover:bg-gray-100 font-medium bg-transparent"
                          >
                            <Download className="w-4 h-4 mr-2" />
                            Baixar
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={printImage}
                            className="justify-start text-gray-800 border-gray-300 hover:bg-gray-100 font-medium bg-transparent"
                          >
                            <Printer className="w-4 h-4 mr-2" />
                            Imprimir
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={shareImage}
                            className="justify-start text-pink-800 border-pink-300 hover:bg-pink-100 font-medium bg-transparent"
                          >
                            <Share2 className="w-4 h-4 mr-2" />
                            Compartilhar
                          </Button>

                          <div className="border-t border-green-300 my-1" />

                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={regenerate}
                            className="justify-start text-gray-600 hover:text-gray-800 font-medium"
                          >
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Gerar Novamente
                          </Button>
                        </div>
                      </div>

                      {/* Edicao */}
                      {isEditing && (
                        <div className="border-t border-green-300 bg-blue-50 p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-bold text-blue-900">Descreva as alteracoes</p>
                            <button onClick={() => setIsEditing(false)} className="text-blue-700 hover:text-blue-900">
                              <X className="w-4 h-4" />
                            </button>
                          </div>

                          <Input
                            placeholder="Ex: Remover imagem, adicionar linhas..."
                            value={editPrompt}
                            onChange={(e) => setEditPrompt(e.target.value)}
                            disabled={isApplyingEdit}
                            className="bg-white text-gray-900 placeholder:text-gray-500 border-blue-300"
                          />

                          <div className="flex flex-wrap gap-1">
                            {editSuggestions.map((s, i) => (
                              <button
                                key={i}
                                onClick={() => setEditPrompt(s)}
                                className="text-xs bg-white border border-blue-300 px-2 py-1 rounded-full hover:bg-blue-100 text-blue-800 font-medium"
                                disabled={isApplyingEdit}
                              >
                                {s}
                              </button>
                            ))}
                          </div>

                          <Button
                            onClick={applyEdit}
                            disabled={!editPrompt.trim() || isApplyingEdit}
                            size="sm"
                            className="w-full bg-blue-700 hover:bg-blue-800 text-white font-bold"
                          >
                            {isApplyingEdit ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Aplicando...
                              </>
                            ) : (
                              <>
                                <Wand2 className="w-4 h-4 mr-2" />
                                Aplicar Edicao
                              </>
                            )}
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Mini features abaixo do card */}
            <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-700 mt-6">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-amber-600" />
                <span className="font-medium">Alfabetizacao ao 9o ano</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-600" />
                <span className="font-medium">Pronto em segundos</span>
              </div>
              <div className="flex items-center gap-2">
                <Printer className="w-4 h-4 text-amber-600" />
                <span className="font-medium">Pronto para imprimir</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-amber-600" />
                <span className="font-medium">Alinhado a BNCC</span>
              </div>
              <div className="flex items-center gap-2">
                <VenetianMask className="w-4 h-4 text-amber-600" />
                <span className="font-medium">Sem Login</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onSuccess={() => {
          refreshCredits()
        }}
      />
    </>
  )
})

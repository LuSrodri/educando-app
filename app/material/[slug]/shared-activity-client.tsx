"use client"

import { useState } from "react"
import { track } from "@vercel/analytics"
import { Button } from "@/components/ui/button"
import { PinterestSaveButton } from "@/components/pinterest-save-button"
import {
  Bookmark,
  BookmarkCheck,
  Check,
  Copy,
  Crown,
  Download,
  Loader2,
  Printer,
  Share2,
} from "lucide-react"
import { useAuthGate } from "@/components/auth/auth-gate-context"

interface SharedActivityClientProps {
  activityId: string
  imageUrl: string
  activityTitle: string
  /**
   * "public" = atividade curated do diretório (download/imprimir/salvar são
   * premium, mostra Crown e Pinterest). "personal" = atividade gerada pelo
   * próprio user (tudo livre, sem Crown, sem Salvar, sem Pinterest).
   */
  mode?: "public" | "personal"
  initialSaved?: boolean
}

export function SharedActivityClient({
  activityId,
  imageUrl,
  activityTitle,
  mode = "public",
  initialSaved = false,
}: SharedActivityClientProps) {
  const isPublicCurated = mode === "public"
  const { user, isPremium, openPaywall } = useAuthGate()
  const [copied, setCopied] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isSaved, setIsSaved] = useState(initialSaved)

  const shareUrl =
    typeof window !== "undefined"
      ? window.location.href
      : `https://educando.app/material/${activityId}`

  async function downloadImage() {
    setIsDownloading(true)
    try {
      const response = await fetch(imageUrl)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `atividade-${activityId}.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Error downloading image:", error)
    } finally {
      setIsDownloading(false)
    }
  }

  function printImage() {
    const iframe = document.createElement("iframe")
    iframe.style.cssText = "position:absolute;visibility:hidden;width:1px;height:1px;border:0;"
    document.body.appendChild(iframe)

    const doc = iframe.contentDocument || iframe.contentWindow?.document
    if (!doc) {
      document.body.removeChild(iframe)
      return
    }

    const cleanup = () => {
      if (document.body.contains(iframe)) document.body.removeChild(iframe)
    }

    doc.write(`
      <html>
        <head>
          <title>Atividade Escolar - educando.app</title>
          <style>
            html, body { margin: 0; padding: 0; height: 100%; }
            body { display: flex; align-items: center; justify-content: center; }
            img { max-width: 100%; max-height: 100vh; width: auto; height: auto; display: block; object-fit: contain; }
            @media print {
              @page { size: A4; margin: 0; }
              html, body { width: 210mm; height: 297mm; }
              body { display: flex; align-items: center; justify-content: center; }
              img { max-width: 210mm; max-height: 297mm; width: auto; height: auto; page-break-inside: avoid; object-fit: contain; }
            }
          </style>
        </head>
        <body><img src="${imageUrl}" crossorigin="anonymous" /></body>
      </html>
    `)
    doc.close()

    const img = doc.querySelector("img")
    if (!img) {
      cleanup()
      return
    }

    const triggerPrint = () => {
      try {
        iframe.contentWindow?.focus()
        iframe.contentWindow?.print()
      } catch (error) {
        console.error("Error printing image:", error)
      }
      setTimeout(cleanup, 1000)
    }

    if (img.complete && img.naturalWidth > 0) {
      triggerPrint()
    } else {
      img.onload = triggerPrint
      img.onerror = cleanup
    }
  }

  async function toggleSaved() {
    setIsSaving(true)
    try {
      const method = isSaved ? "DELETE" : "POST"
      const res = await fetch("/api/salvar", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activityId }),
      })
      if (res.ok) {
        setIsSaved(!isSaved)
      } else {
        console.error("[salvar] failed", await res.text())
      }
    } catch (error) {
      console.error("Error toggling saved:", error)
    } finally {
      setIsSaving(false)
    }
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error("Error copying link:", error)
    }
  }

  async function shareNative() {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Atividade: ${activityTitle}`,
          text: "Confira essa atividade escolar criada com educando.app!",
          url: shareUrl,
        })
      } catch {
        copyLink()
      }
    } else {
      copyLink()
    }
  }

  function trackPaywallTriggered(action: "download" | "print" | "bookmark") {
    track("paywall_triggered", {
      action,
      user_id: user?.id ?? null,
      activity_id: activityId,
    })
  }

  // ─── handlers que checam premium antes de executar ──────────────────────
  function handleDownloadClick() {
    if (isPublicCurated && !isPremium) {
      trackPaywallTriggered("download")
      openPaywall({ action: "download", onAfterSubscribed: () => downloadImage() })
      return
    }
    downloadImage()
  }
  function handlePrintClick() {
    if (isPublicCurated && !isPremium) {
      trackPaywallTriggered("print")
      openPaywall({ action: "print", onAfterSubscribed: () => printImage() })
      return
    }
    printImage()
  }
  function handleSaveClick() {
    if (!isPremium) {
      trackPaywallTriggered("bookmark")
      openPaywall({ action: "save", onAfterSubscribed: () => toggleSaved() })
      return
    }
    toggleSaved()
  }

  const showCrown = isPublicCurated
  const crownClass = isPremium ? "text-amber-500" : "text-gray-400"

  return (
    <div className="border-t border-amber-100 bg-amber-50 p-4">
      <div className="flex flex-wrap gap-2 justify-center">
        <Button
          onClick={handleDownloadClick}
          disabled={isDownloading}
          variant="outline"
          className="bg-white border-gray-300 hover:bg-gray-50 text-gray-700"
        >
          {showCrown && <Crown className={`w-4 h-4 ${crownClass}`} />}
          {isDownloading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Download className="w-4 h-4" />
          )}
          Baixar
        </Button>

        <Button
          onClick={handlePrintClick}
          variant="outline"
          className="bg-white border-gray-300 hover:bg-gray-50 text-gray-700"
        >
          {showCrown && <Crown className={`w-4 h-4 ${crownClass}`} />}
          <Printer className="w-4 h-4" />
          Imprimir
        </Button>

        {isPublicCurated && (
          <Button
            onClick={handleSaveClick}
            disabled={isSaving}
            variant="outline"
            className={`bg-white hover:bg-gray-50 ${
              isSaved && isPremium
                ? "border-amber-300 text-amber-700"
                : "border-gray-300 text-gray-700"
            }`}
          >
            <Crown className={`w-4 h-4 ${crownClass}`} />
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : isSaved && isPremium ? (
              <BookmarkCheck className="w-4 h-4" />
            ) : (
              <Bookmark className="w-4 h-4" />
            )}
            {isSaved && isPremium ? "Salvo" : "Salvar"}
          </Button>
        )}

        <Button
          onClick={shareNative}
          variant="outline"
          className="bg-white border-pink-300 hover:bg-pink-50 text-pink-700"
        >
          <Share2 className="w-4 h-4" />
          Compartilhar
        </Button>

        <Button
          onClick={copyLink}
          variant="outline"
          className={`bg-white ${copied ? "border-green-300 text-green-700" : "border-gray-300 text-gray-700"} hover:bg-gray-50`}
        >
          {copied ? (
            <>
              <Check className="w-4 h-4" />
              Copiado!
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              Copiar Link
            </>
          )}
        </Button>

        {isPublicCurated && (
          <PinterestSaveButton
            activityUrl={`https://educando.app/material/${activityId}`}
            imageUrl={imageUrl}
            description={activityTitle}
          />
        )}
      </div>
    </div>
  )
}

"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { PinterestSaveButton } from "@/components/pinterest-save-button"
import { Download, Printer, Share2, Check, Copy, Loader2 } from "lucide-react"

interface SharedActivityClientProps {
  activityId: string
  imageUrl: string
  activityTitle: string
}

export function SharedActivityClient({ activityId, imageUrl, activityTitle }: SharedActivityClientProps) {
  const [copied, setCopied] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)

  const shareUrl = typeof window !== "undefined"
    ? window.location.href
    : `https://educando.app/material/${activityId}`

  const downloadImage = async () => {
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

  const printImage = () => {
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
            body { margin: 0; }
            img { max-width: 100%; height: auto; display: block; }
            @media print {
              body { margin: 0; }
              img { max-width: 100%; page-break-inside: avoid; }
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

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error("Error copying link:", error)
    }
  }

  const shareNative = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Atividade: ${activityTitle}`,
          text: "Confira essa atividade escolar criada com educando.app!",
          url: shareUrl,
        })
      } catch (error) {
        // User cancelled or error - fallback to copy
        copyLink()
      }
    } else {
      copyLink()
    }
  }

  return (
    <div className="border-t border-amber-100 bg-amber-50 p-4">
      <div className="flex flex-wrap gap-2 justify-center">
        <Button
          onClick={downloadImage}
          disabled={isDownloading}
          variant="outline"
          className="bg-white border-gray-300 hover:bg-gray-50 text-gray-700"
        >
          {isDownloading ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Download className="w-4 h-4 mr-2" />
          )}
          Baixar
        </Button>

        <Button
          onClick={printImage}
          variant="outline"
          className="bg-white border-gray-300 hover:bg-gray-50 text-gray-700"
        >
          <Printer className="w-4 h-4 mr-2" />
          Imprimir
        </Button>

        <Button
          onClick={shareNative}
          variant="outline"
          className="bg-white border-pink-300 hover:bg-pink-50 text-pink-700"
        >
          <Share2 className="w-4 h-4 mr-2" />
          Compartilhar
        </Button>

        <Button
          onClick={copyLink}
          variant="outline"
          className={`bg-white ${copied ? "border-green-300 text-green-700" : "border-gray-300 text-gray-700"} hover:bg-gray-50`}
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 mr-2" />
              Copiado!
            </>
          ) : (
            <>
              <Copy className="w-4 h-4 mr-2" />
              Copiar Link
            </>
          )}
        </Button>
        <PinterestSaveButton
          activityUrl={`https://educando.app/material/${activityId}`}
          imageUrl={imageUrl}
          description={activityTitle}
        />
      </div>
    </div>
  )
}

"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Share2,
  Copy,
  Check,
  Loader2,
  ExternalLink,
  MessageCircle,
  Facebook,
  Twitter,
  Linkedin,
} from "lucide-react"

interface ShareModalProps {
  isOpen: boolean
  onClose: () => void
  activityId: string
  activityTitle: string
  activityImage?: string
}

export function ShareModal({
  isOpen,
  onClose,
  activityId,
  activityTitle,
  activityImage,
}: ShareModalProps) {
  const [shareUrl, setShareUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen && activityId && !shareUrl) {
      createShareLink()
    }
  }, [isOpen, activityId])

  const createShareLink = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/share/${activityId}`, {
        method: "POST",
      })

      if (!response.ok) {
        throw new Error("Failed to create share link")
      }

      const data = await response.json()
      setShareUrl(data.shareUrl)
    } catch (err) {
      setError("Erro ao criar link de compartilhamento. Tente novamente.")
      console.error("Error creating share link:", err)
    } finally {
      setIsLoading(false)
    }
  }

  const copyLink = async () => {
    if (!shareUrl) return

    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Error copying link:", err)
    }
  }

  const openInNewTab = () => {
    if (shareUrl) {
      window.open(shareUrl, "_blank")
    }
  }

  const shareToWhatsApp = () => {
    if (!shareUrl) return
    const text = `Confira essa atividade escolar que criei com educando.app: ${shareUrl}`
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank")
  }

  const shareToFacebook = () => {
    if (!shareUrl) return
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, "_blank")
  }

  const shareToTwitter = () => {
    if (!shareUrl) return
    const text = `Confira essa atividade escolar que criei com educando.app!`
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`, "_blank")
  }

  const shareToLinkedIn = () => {
    if (!shareUrl) return
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`, "_blank")
  }

  const handleClose = () => {
    setShareUrl(null)
    setCopied(false)
    setError(null)
    onClose()
  }

  const truncateTitle = (title: string, maxLength: number = 50) => {
    if (title.length <= maxLength) return title
    return title.slice(0, maxLength) + "..."
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-pink-600" />
            Compartilhar Atividade
          </DialogTitle>
          <DialogDescription>
            Compartilhe esta atividade com outros professores e colegas.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
              <span className="ml-2 text-gray-600">Gerando link...</span>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-700 text-sm">{error}</p>
              <Button
                onClick={createShareLink}
                variant="outline"
                size="sm"
                className="mt-2"
              >
                Tentar novamente
              </Button>
            </div>
          ) : shareUrl ? (
            <>
              {/* Link Input */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Link da atividade</label>
                <div className="flex gap-2">
                  <Input
                    value={shareUrl}
                    readOnly
                    className="bg-gray-50 text-sm"
                  />
                  <Button
                    onClick={copyLink}
                    variant="outline"
                    className={copied ? "border-green-500 text-green-700" : ""}
                  >
                    {copied ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
                {copied && (
                  <p className="text-xs text-green-600">Link copiado!</p>
                )}
              </div>

              {/* Social Share Buttons */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Compartilhar em</label>
                <div className="grid grid-cols-4 gap-2">
                  <Button
                    onClick={shareToWhatsApp}
                    variant="outline"
                    className="flex flex-col items-center gap-1 h-auto py-3 hover:bg-green-50 hover:border-green-300"
                  >
                    <MessageCircle className="w-5 h-5 text-green-600" />
                    <span className="text-xs">WhatsApp</span>
                  </Button>
                  <Button
                    onClick={shareToFacebook}
                    variant="outline"
                    className="flex flex-col items-center gap-1 h-auto py-3 hover:bg-blue-50 hover:border-blue-300"
                  >
                    <Facebook className="w-5 h-5 text-blue-600" />
                    <span className="text-xs">Facebook</span>
                  </Button>
                  <Button
                    onClick={shareToTwitter}
                    variant="outline"
                    className="flex flex-col items-center gap-1 h-auto py-3 hover:bg-sky-50 hover:border-sky-300"
                  >
                    <Twitter className="w-5 h-5 text-sky-500" />
                    <span className="text-xs">Twitter</span>
                  </Button>
                  <Button
                    onClick={shareToLinkedIn}
                    variant="outline"
                    className="flex flex-col items-center gap-1 h-auto py-3 hover:bg-blue-50 hover:border-blue-300"
                  >
                    <Linkedin className="w-5 h-5 text-blue-700" />
                    <span className="text-xs">LinkedIn</span>
                  </Button>
                </div>
              </div>

              {/* Preview */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Preview</label>
                <div className="bg-gray-50 rounded-lg border border-gray-200 p-3">
                  <div className="flex gap-3">
                    {activityImage && (
                      <img
                        src={activityImage}
                        alt="Preview"
                        className="w-16 h-16 object-cover rounded border"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 text-sm truncate">
                        Atividade: {truncateTitle(activityTitle)}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">educando.app</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Open Link Button */}
              <Button
                onClick={openInNewTab}
                variant="outline"
                className="w-full"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Abrir link em nova aba
              </Button>
            </>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  )
}

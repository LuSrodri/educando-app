"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useBrowserId } from "@/hooks/useBrowserId"
import { useActivities } from "@/hooks/useActivities"
import { Button } from "@/components/ui/button"
import { ShareModal } from "@/components/share-modal"
import {
  History,
  Download,
  Printer,
  Loader2,
  Share2,
  RefreshCw,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import type { Activity } from "@/lib/supabase/types"

export function ActivityHistoryCarousel() {
  const { browserId, isLoading: browserLoading } = useBrowserId()
  const { activities, isLoading } = useActivities(browserId, 20)
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null)
  const [activityImage, setActivityImage] = useState<string | null>(null)
  const [loadingImage, setLoadingImage] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)
  const carouselRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (selectedActivity) {
      loadActivityImage(selectedActivity.id)
    }
  }, [selectedActivity])

  const loadActivityImage = async (activityId: string) => {
    setLoadingImage(true)
    try {
      const response = await fetch(`/api/activities/${activityId}`)
      const data = await response.json()
      setActivityImage(data.imageUrl)
    } catch (error) {
      console.error("Error loading image:", error)
    } finally {
      setLoadingImage(false)
    }
  }

  const scroll = (direction: "left" | "right") => {
    if (carouselRef.current) {
      const scrollAmount = 220
      carouselRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      })
    }
  }

  const downloadImage = () => {
    if (activityImage) {
      const link = document.createElement("a")
      link.href = activityImage
      link.download = `atividade-${selectedActivity?.id}.png`
      link.click()
    }
  }

  const printImage = () => {
    if (activityImage) {
      const printWindow = window.open("", "_blank")
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head><title>Atividade Escolar</title></head>
            <body style="margin:0;display:flex;justify-content:center;">
              <img src="${activityImage}" style="max-width:100%;height:auto;" onload="window.print();window.close();" />
            </body>
          </html>
        `)
        printWindow.document.close()
      }
    }
  }

  if (browserLoading || isLoading) {
    return null
  }

  if (activities.length === 0) {
    return null
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-900 font-heading flex items-center gap-2">
          <History className="w-5 h-5 text-amber-600" />
          Seu Historico
        </h2>
        <div className="flex gap-1">
          <button
            onClick={() => scroll("left")}
            className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => scroll("right")}
            className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Carousel */}
      <div
        ref={carouselRef}
        className="flex gap-3 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-2"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {activities.map((activity) => (
          <button
            key={activity.id}
            onClick={() => setSelectedActivity(activity)}
            className="shrink-0 w-[180px] snap-start cursor-pointer group"
          >
            <div className="aspect-[3/4] rounded-lg overflow-hidden border-2 border-gray-100 group-hover:border-amber-300 transition-colors bg-gray-100">
              <img
                src={`/api/share/${activity.id}/image`}
                alt={activity.original_prompt}
                className="w-full h-full object-cover object-top"
                loading="lazy"
              />
            </div>
            <p className="text-xs text-gray-600 mt-1.5 line-clamp-1 text-left">
              {activity.original_prompt}
            </p>
          </button>
        ))}
      </div>

      {/* Popover for selected activity */}
      {selectedActivity && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setSelectedActivity(null)}>
          <div
            className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-bold text-gray-900 text-sm font-heading">Detalhes da Atividade</h3>
              <button
                onClick={() => setSelectedActivity(null)}
                className="p-1 rounded-lg hover:bg-gray-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-3">
              <p className="text-sm text-gray-700">{selectedActivity.original_prompt}</p>

              {loadingImage ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-amber-600" />
                </div>
              ) : activityImage ? (
                <img
                  src={activityImage}
                  alt="Atividade gerada"
                  className="w-full h-auto rounded-lg border"
                />
              ) : (
                <div className="text-center py-8 text-gray-400 text-sm">
                  Imagem nao disponivel
                </div>
              )}

              <div className="flex flex-wrap gap-2 pt-2">
                <Button size="sm" variant="outline" onClick={downloadImage} disabled={!activityImage} className="cursor-pointer">
                  <Download className="w-4 h-4 mr-1.5" />
                  Baixar
                </Button>
                <Button size="sm" variant="outline" onClick={printImage} disabled={!activityImage} className="cursor-pointer">
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
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedActivity && (
        <ShareModal
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          activityId={selectedActivity.id}
          activityTitle={selectedActivity.original_prompt}
          activityImage={activityImage || undefined}
        />
      )}
    </div>
  )
}

"use client"

import { useState, useRef } from "react"
import { useBrowserId } from "@/hooks/useBrowserId"
import { useActivities } from "@/hooks/useActivities"
import { Button } from "@/components/ui/button"
import { ShareModal } from "@/components/share-modal"
import {
  History,
  Download,
  Printer,
  Share2,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import type { Activity } from "@/lib/supabase/types"
import { getActivityImageUrl, getActivityThumbnailUrl } from "@/lib/image-utils"

export function ActivityHistoryCarousel() {
  const { browserId, isLoading: browserLoading } = useBrowserId()
  const { activities, isLoading } = useActivities(browserId, 20)
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null)
  const [showShareModal, setShowShareModal] = useState(false)
  const carouselRef = useRef<HTMLDivElement>(null)

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
    if (selectedActivity) {
      const link = document.createElement("a")
      link.href = getActivityImageUrl(selectedActivity.image_path)
      link.download = `atividade-${selectedActivity.id}.png`
      link.click()
    }
  }

  const printImage = () => {
    if (!selectedActivity) return
    const imageUrl = getActivityImageUrl(selectedActivity.image_path)
    const printWindow = window.open("", "_blank")
    if (!printWindow) return
    const doc = printWindow.document
    const style = doc.createElement("style")
    style.textContent = "body{margin:0;display:flex;justify-content:center;}img{max-width:100%;height:auto;}"
    doc.head.appendChild(style)
    doc.title = "Atividade Escolar"
    const img = doc.createElement("img")
    img.src = imageUrl
    img.addEventListener("load", () => { printWindow.print(); printWindow.close() })
    doc.body.appendChild(img)
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
          Seu Histórico
        </h2>
        <div className="flex gap-1">
          <button
            onClick={() => scroll("left")}
            className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors cursor-pointer"
            aria-label="Rolar histórico para a esquerda"
          >
            <ChevronLeft className="w-4 h-4" aria-hidden="true" />
          </button>
          <button
            onClick={() => scroll("right")}
            className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors cursor-pointer"
            aria-label="Rolar histórico para a direita"
          >
            <ChevronRight className="w-4 h-4" aria-hidden="true" />
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
                src={getActivityThumbnailUrl(activity.image_path, 360)}
                alt={activity.original_prompt}
                className="w-full h-full object-contain"
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
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          onClick={() => setSelectedActivity(null)}
          aria-hidden="true"
        >
          <div
            className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="history-modal-title"
          >
            <div className="flex items-center justify-between p-4 border-b">
              <h3 id="history-modal-title" className="font-bold text-gray-900 text-sm font-heading">
                Detalhes da Atividade
              </h3>
              <button
                onClick={() => setSelectedActivity(null)}
                className="p-1 rounded-lg hover:bg-gray-100 cursor-pointer"
                aria-label="Fechar"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>

            <div className="p-4 space-y-3">
              <p className="text-sm text-gray-700">{selectedActivity.original_prompt}</p>

              <img
                src={getActivityImageUrl(selectedActivity.image_path)}
                alt="Atividade gerada"
                className="w-full h-auto rounded-lg border"
              />

              <div className="flex flex-wrap gap-2 pt-2">
                <Button size="sm" variant="outline" onClick={downloadImage} className="cursor-pointer">
                  <Download className="w-4 h-4 mr-1.5" />
                  Baixar
                </Button>
                <Button size="sm" variant="outline" onClick={printImage} className="cursor-pointer">
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
          activityImage={getActivityImageUrl(selectedActivity.image_path)}
        />
      )}
    </div>
  )
}

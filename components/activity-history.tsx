"use client"

import { useState, useEffect } from "react"
import { useBrowserId } from "@/hooks/useBrowserId"
import { useActivities, useActivityTree } from "@/hooks/useActivities"
import { VersionTree } from "@/components/version-tree"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  History,
  Calendar,
  GraduationCap,
  ChevronRight,
  Download,
  Printer,
  GitBranch,
  Loader2,
  ArrowLeft,
} from "lucide-react"
import type { Activity } from "@/lib/supabase/types"
import { EDUCATIONAL_LEVELS, type EducationalLevelId } from "@/types/educational-levels"
import Link from "next/link"

export function ActivityHistory() {
  const { browserId, isLoading: browserLoading } = useBrowserId()
  const { activities, isLoading, hasMore, loadMore, refresh } = useActivities(browserId, 20)
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null)
  const [showVersionTree, setShowVersionTree] = useState(false)
  const [activityImage, setActivityImage] = useState<string | null>(null)
  const [loadingImage, setLoadingImage] = useState(false)

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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getEducationalLevelName = (levelId: string) => {
    const level = EDUCATIONAL_LEVELS[levelId as EducationalLevelId]
    return level?.displayName || levelId
  }

  const handleDownload = () => {
    if (activityImage) {
      const link = document.createElement("a")
      link.href = activityImage
      link.download = `atividade-${selectedActivity?.id}.png`
      link.click()
    }
  }

  const handlePrint = () => {
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
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
        <span className="ml-2 text-gray-600">Carregando histórico...</span>
      </div>
    )
  }

  if (activities.length === 0) {
    return (
      <div className="text-center py-12">
        <History className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-600 mb-2">
          Nenhuma atividade encontrada
        </h3>
        <p className="text-gray-500 mb-6">
          Comece criando sua primeira atividade escolar!
        </p>
        <Link href="/">
          <Button className="bg-amber-600 hover:bg-amber-700">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Criar Atividade
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-sm">
            {activities.length} atividade{activities.length !== 1 ? "s" : ""}
          </Badge>
        </div>
        <Link href="/">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {activities.map((activity) => (
          <Card
            key={activity.id}
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => setSelectedActivity(activity)}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <Badge
                  variant={activity.generation_type === "original" ? "default" : "secondary"}
                  className="text-xs"
                >
                  {activity.generation_type === "original" ? "Original" : `v${activity.version_number}`}
                </Badge>
                {activity.parent_id && (
                  <GitBranch className="w-4 h-4 text-purple-500" />
                )}
              </div>

              <p className="text-sm text-gray-700 line-clamp-2 mb-3">
                {activity.original_prompt}
              </p>

              <div className="flex items-center gap-4 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <GraduationCap className="w-3 h-3" />
                  {getEducationalLevelName(activity.educational_level)}
                  {activity.grade && ` - ${activity.grade}º`}
                </span>
              </div>

              <div className="flex items-center justify-between mt-3 pt-3 border-t">
                <span className="flex items-center gap-1 text-xs text-gray-400">
                  <Calendar className="w-3 h-3" />
                  {formatDate(activity.created_at)}
                </span>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {hasMore && (
        <div className="text-center pt-4">
          <Button variant="outline" onClick={loadMore}>
            Carregar mais
          </Button>
        </div>
      )}

      {/* Activity Detail Dialog */}
      <Dialog open={!!selectedActivity} onOpenChange={() => setSelectedActivity(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="w-5 h-5" />
              Detalhes da Atividade
            </DialogTitle>
            <DialogDescription className="sr-only">
              Visualize os detalhes da atividade gerada
            </DialogDescription>
          </DialogHeader>

          {selectedActivity && (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Badge>
                  {getEducationalLevelName(selectedActivity.educational_level)}
                  {selectedActivity.grade && ` - ${selectedActivity.grade}º ano`}
                </Badge>
                <Badge variant="secondary">
                  {selectedActivity.generation_type === "original"
                    ? "Original"
                    : `Versão ${selectedActivity.version_number}`}
                </Badge>
                <Badge variant="outline">{formatDate(selectedActivity.created_at)}</Badge>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-sm text-gray-600 mb-2">Prompt Original</h4>
                <p className="text-gray-800">{selectedActivity.original_prompt}</p>

                {selectedActivity.edit_prompt && (
                  <div className="mt-3 pt-3 border-t">
                    <h4 className="font-semibold text-sm text-gray-600 mb-2">Edição Aplicada</h4>
                    <p className="text-gray-800">{selectedActivity.edit_prompt}</p>
                  </div>
                )}
              </div>

              {loadingImage ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
                </div>
              ) : activityImage ? (
                <div className="border rounded-lg overflow-hidden">
                  <img
                    src={activityImage}
                    alt="Atividade gerada"
                    className="w-full h-auto"
                  />
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  Imagem não disponível
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                <Button onClick={handleDownload} disabled={!activityImage}>
                  <Download className="w-4 h-4 mr-2" />
                  Baixar
                </Button>
                <Button variant="outline" onClick={handlePrint} disabled={!activityImage}>
                  <Printer className="w-4 h-4 mr-2" />
                  Imprimir
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowVersionTree(true)}
                  className="ml-auto"
                >
                  <GitBranch className="w-4 h-4 mr-2" />
                  Ver Versões
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Version Tree Dialog */}
      <Dialog open={showVersionTree} onOpenChange={setShowVersionTree}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GitBranch className="w-5 h-5" />
              Árvore de Versões
            </DialogTitle>
            <DialogDescription className="sr-only">
              Visualize todas as versões desta atividade
            </DialogDescription>
          </DialogHeader>

          {selectedActivity && (
            <VersionTree
              activityId={selectedActivity.id}
              onSelect={(activity) => {
                setSelectedActivity(activity)
                setShowVersionTree(false)
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

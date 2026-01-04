"use client"

import { useActivityTree } from "@/hooks/useActivities"
import { GitBranch, GitCommit, Loader2 } from "lucide-react"
import type { Activity } from "@/lib/supabase/types"

interface VersionTreeProps {
  activityId: string
  currentId?: string
  onSelect: (activity: Activity) => void
}

export function VersionTree({ activityId, currentId, onSelect }: VersionTreeProps) {
  const { activities, isLoading, error } = useActivityTree(activityId)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-amber-600" />
        <span className="ml-2 text-gray-600">Carregando arvore...</span>
      </div>
    )
  }

  if (error || activities.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        Nenhuma versao encontrada
      </div>
    )
  }

  // Build tree structure from flat list
  const buildTree = () => {
    const root = activities.find((a) => a.parent_id === null)
    if (!root) return null

    const childrenMap = new Map<string, Activity[]>()
    activities.forEach((a) => {
      if (a.parent_id) {
        const children = childrenMap.get(a.parent_id) || []
        children.push(a)
        childrenMap.set(a.parent_id, children)
      }
    })

    return { root, childrenMap }
  }

  const tree = buildTree()
  if (!tree) return null

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const renderNode = (activity: Activity, depth: number) => {
    const children = tree.childrenMap.get(activity.id) || []
    const isSelected = activity.id === (currentId || activityId)
    const isFork = children.length > 1

    return (
      <div key={activity.id} className="relative">
        {/* Connection line */}
        {depth > 0 && (
          <div
            className="absolute left-3 -top-2 w-px h-2 bg-gray-300"
            style={{ marginLeft: (depth - 1) * 24 }}
          />
        )}

        <div
          className={`flex items-center gap-2 p-3 rounded-lg cursor-pointer transition-colors
            ${isSelected ? "bg-amber-100 border-2 border-amber-400" : "hover:bg-gray-100 border border-transparent"}
          `}
          style={{ marginLeft: depth * 24 }}
          onClick={() => onSelect(activity)}
        >
          {isFork ? (
            <GitBranch className="w-5 h-5 text-purple-600 flex-shrink-0" />
          ) : (
            <GitCommit className="w-5 h-5 text-gray-400 flex-shrink-0" />
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm">
                {activity.generation_type === "original"
                  ? "Original"
                  : `v${activity.version_number}`}
              </span>
              {activity.generation_type === "edit" && (
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                  Edicao
                </span>
              )}
              {activity.generation_type === "fork" && (
                <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded">
                  Fork
                </span>
              )}
            </div>

            {activity.edit_prompt && (
              <p className="text-xs text-gray-600 truncate mt-1">
                {activity.edit_prompt}
              </p>
            )}

            <p className="text-xs text-gray-400 mt-1">{formatDate(activity.created_at)}</p>
          </div>
        </div>

        {/* Render children */}
        {children.map((child) => renderNode(child, depth + 1))}
      </div>
    )
  }

  return (
    <div className="border rounded-lg p-4 bg-white max-h-96 overflow-y-auto">
      <div className="flex items-center gap-2 mb-4 pb-2 border-b">
        <GitBranch className="w-5 h-5 text-gray-600" />
        <span className="font-semibold text-gray-800">Arvore de Versoes</span>
        <span className="text-xs text-gray-500 ml-auto">
          {activities.length} versao{activities.length !== 1 ? "oes" : ""}
        </span>
      </div>

      {renderNode(tree.root, 0)}
    </div>
  )
}

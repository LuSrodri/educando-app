"use client"

import { Users } from "lucide-react"
import { CommunityGrid } from "@/components/community-grid"

export function CommunitySection() {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-gray-900 font-heading flex items-center gap-2">
        <Users className="w-5 h-5 text-amber-600" />
        Comunidade
      </h2>
      <p className="text-sm text-gray-500">
        Todas as atividades geradas pelos educadores.
      </p>
      <CommunityGrid />
    </div>
  )
}

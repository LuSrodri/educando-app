"use client"

import { useEffect } from "react"
import Clarity from "@microsoft/clarity"

export function ClarityAnalytics() {
  const projectId = process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID

  useEffect(() => {
    if (!projectId) return
    Clarity.init(projectId)
  }, [projectId])

  return null
}

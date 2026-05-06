"use client"

import { useEffect } from "react"
import Clarity from "@microsoft/clarity"

export function ClarityAnalytics() {
  const projectId = process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID

  useEffect(() => {
    if (!projectId) return
    const start = () => Clarity.init(projectId)
    if (typeof window !== "undefined" && "requestIdleCallback" in window) {
      ;(window as unknown as { requestIdleCallback: (fn: () => void, opts: { timeout: number }) => void })
        .requestIdleCallback(start, { timeout: 3000 })
    } else {
      setTimeout(start, 1500)
    }
  }, [projectId])

  return null
}

"use client"

import { useEffect, useState, useCallback } from "react"
import { FREE_DAILY_LIMIT, PRICE_PER_ACTIVITY } from "@/lib/session"

interface CreditsState {
  dailyUsage: number
  extraCredits: number
  remainingFree: number
  isLoading: boolean
  error: Error | null
}

export function useCredits(browserId: string | null) {
  const [state, setState] = useState<CreditsState>({
    dailyUsage: 0,
    extraCredits: 0,
    remainingFree: FREE_DAILY_LIMIT,
    isLoading: true,
    error: null,
  })

  const fetchCredits = useCallback(async () => {
    if (!browserId) {
      setState((prev) => ({ ...prev, isLoading: false }))
      return
    }

    try {
      const response = await fetch(`/api/browser?browserId=${encodeURIComponent(browserId)}`)

      if (!response.ok) {
        throw new Error("Failed to fetch credits")
      }

      const data = await response.json()

      setState({
        dailyUsage: data.dailyUsage || 0,
        extraCredits: data.extraCredits || 0,
        remainingFree: Math.max(0, FREE_DAILY_LIMIT - (data.dailyUsage || 0)),
        isLoading: false,
        error: null,
      })
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error : new Error("Failed to fetch credits"),
      }))
    }
  }, [browserId])

  useEffect(() => {
    fetchCredits()
  }, [fetchCredits])

  const canGenerate = state.remainingFree > 0 || state.extraCredits > 0

  const refresh = useCallback(() => {
    setState((prev) => ({ ...prev, isLoading: true }))
    fetchCredits()
  }, [fetchCredits])

  return {
    dailyUsage: state.dailyUsage,
    extraCredits: state.extraCredits,
    remainingFree: state.remainingFree,
    canGenerate,
    isLoading: state.isLoading,
    error: state.error,
    refresh,
    FREE_DAILY_LIMIT,
    PRICE_PER_ACTIVITY,
  }
}

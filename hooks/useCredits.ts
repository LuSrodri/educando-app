"use client"

import { useEffect, useState, useCallback } from "react"

const FREE_FORTNIGHTLY_LIMIT = 3

interface CreditsState {
  fortnightlyUsage: number
  remainingFree: number
  paidBalance: number
  isLoading: boolean
  error: Error | null
}

export function useCredits(browserId: string | null) {
  const [state, setState] = useState<CreditsState>({
    fortnightlyUsage: 0,
    remainingFree: FREE_FORTNIGHTLY_LIMIT,
    paidBalance: 0,
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
      const usage = data.fortnightlyUsage || 0
      const paid = data.paidBalance || 0

      setState({
        fortnightlyUsage: usage,
        remainingFree: Math.max(0, FREE_FORTNIGHTLY_LIMIT - usage),
        paidBalance: paid,
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

  const hasPaidCredits = state.paidBalance > 0
  const canGenerate = state.remainingFree > 0 || hasPaidCredits

  const refresh = useCallback(() => {
    setState((prev) => ({ ...prev, isLoading: true }))
    fetchCredits()
  }, [fetchCredits])

  return {
    fortnightlyUsage: state.fortnightlyUsage,
    remainingFree: state.remainingFree,
    paidBalance: state.paidBalance,
    hasPaidCredits,
    canGenerate,
    isLoading: state.isLoading,
    error: state.error,
    refresh,
    FREE_FORTNIGHTLY_LIMIT,
  }
}

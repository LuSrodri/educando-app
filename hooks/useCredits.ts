"use client"

import { useEffect, useState, useCallback } from "react"

interface CreditsState {
  fortnightlyUsage: number
  remainingFree: number
  paidBalance: number
  freeLimit: number
  isLoading: boolean
  error: Error | null
}

export function useCredits(browserId: string | null) {
  const [state, setState] = useState<CreditsState>({
    fortnightlyUsage: 0,
    remainingFree: 0,
    paidBalance: 0,
    freeLimit: 0,
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
      const limit = data.freeLimit || 0

      setState({
        fortnightlyUsage: usage,
        remainingFree: Math.max(0, limit - usage),
        paidBalance: paid,
        freeLimit: limit,
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
    freeLimit: state.freeLimit,
    hasPaidCredits,
    canGenerate,
    isLoading: state.isLoading,
    error: state.error,
    refresh,
  }
}

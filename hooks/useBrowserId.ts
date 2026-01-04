"use client"

import { useEffect, useState, useCallback } from "react"
import { getOrCreateBrowserId, syncBrowserWithSupabase } from "@/lib/browser-id"

interface BrowserState {
  browserId: string | null
  isLoading: boolean
  error: Error | null
}

export function useBrowserId() {
  const [state, setState] = useState<BrowserState>({
    browserId: null,
    isLoading: true,
    error: null,
  })

  const initialize = useCallback(async () => {
    try {
      const id = getOrCreateBrowserId()
      if (id) {
        await syncBrowserWithSupabase(id)
        setState({ browserId: id, isLoading: false, error: null })
      } else {
        setState({ browserId: null, isLoading: false, error: null })
      }
    } catch (error) {
      setState({
        browserId: null,
        isLoading: false,
        error: error instanceof Error ? error : new Error("Failed to initialize browser ID"),
      })
    }
  }, [])

  useEffect(() => {
    initialize()
  }, [initialize])

  return {
    browserId: state.browserId,
    isLoading: state.isLoading,
    error: state.error,
    refresh: initialize,
  }
}

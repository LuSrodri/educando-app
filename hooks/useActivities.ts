"use client"

import { useEffect, useState, useCallback } from "react"
import type { Activity } from "@/lib/supabase/types"

interface ActivitiesState {
  activities: Activity[]
  isLoading: boolean
  error: Error | null
  hasMore: boolean
}

export function useActivities(browserId: string | null, limit = 20) {
  const [state, setState] = useState<ActivitiesState>({
    activities: [],
    isLoading: true,
    error: null,
    hasMore: true,
  })
  const [offset, setOffset] = useState(0)

  const fetchActivities = useCallback(
    async (reset = false) => {
      if (!browserId) {
        setState((prev) => ({ ...prev, isLoading: false }))
        return
      }

      const currentOffset = reset ? 0 : offset

      try {
        setState((prev) => ({ ...prev, isLoading: true }))

        const response = await fetch(
          `/api/activities?browserId=${encodeURIComponent(browserId)}&limit=${limit}&offset=${currentOffset}`
        )

        if (!response.ok) {
          throw new Error("Failed to fetch activities")
        }

        const data = await response.json()
        const newActivities = data.activities || []

        setState((prev) => ({
          activities: reset ? newActivities : [...prev.activities, ...newActivities],
          isLoading: false,
          error: null,
          hasMore: newActivities.length === limit,
        }))

        if (!reset) {
          setOffset(currentOffset + limit)
        } else {
          setOffset(limit)
        }
      } catch (error) {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: error instanceof Error ? error : new Error("Failed to fetch activities"),
        }))
      }
    },
    [browserId, limit, offset]
  )

  useEffect(() => {
    if (browserId) {
      fetchActivities(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [browserId])

  const loadMore = useCallback(() => {
    if (!state.isLoading && state.hasMore) {
      fetchActivities(false)
    }
  }, [fetchActivities, state.isLoading, state.hasMore])

  const refresh = useCallback(() => {
    setOffset(0)
    fetchActivities(true)
  }, [fetchActivities])

  return {
    activities: state.activities,
    isLoading: state.isLoading,
    error: state.error,
    hasMore: state.hasMore,
    loadMore,
    refresh,
  }
}

export function useActivityTree(rootId: string | null) {
  const [state, setState] = useState<{
    activities: Activity[]
    isLoading: boolean
    error: Error | null
  }>({
    activities: [],
    isLoading: true,
    error: null,
  })

  const fetchTree = useCallback(async () => {
    if (!rootId) {
      setState((prev) => ({ ...prev, isLoading: false }))
      return
    }

    try {
      setState((prev) => ({ ...prev, isLoading: true }))

      const response = await fetch(`/api/activities/${rootId}/tree`)

      if (!response.ok) {
        throw new Error("Failed to fetch activity tree")
      }

      const data = await response.json()

      setState({
        activities: data.activities || [],
        isLoading: false,
        error: null,
      })
    } catch (error) {
      setState({
        activities: [],
        isLoading: false,
        error: error instanceof Error ? error : new Error("Failed to fetch activity tree"),
      })
    }
  }, [rootId])

  useEffect(() => {
    fetchTree()
  }, [fetchTree])

  return {
    activities: state.activities,
    isLoading: state.isLoading,
    error: state.error,
    refresh: fetchTree,
  }
}

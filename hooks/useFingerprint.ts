"use client"

import { useEffect, useState } from "react"

const STORAGE_KEY = "educando_fp_id"

// Lazy-import FingerprintJS to avoid ballooning the client bundle when the
// module isn't needed (SSR / bot traffic).
async function computeFingerprint(): Promise<string> {
  const FP = (await import("@fingerprintjs/fingerprintjs")).default
  const fp = await FP.load()
  const result = await fp.get()
  return result.visitorId
}

export function useFingerprint(): string | null {
  const [fpId, setFpId] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    try {
      const cached = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null
      if (cached) {
        setFpId(cached)
        return
      }
    } catch {
      // localStorage may be disabled; fall through to compute
    }

    computeFingerprint()
      .then((id) => {
        if (cancelled) return
        try {
          localStorage.setItem(STORAGE_KEY, id)
        } catch {
          // ignore persistence errors
        }
        setFpId(id)
      })
      .catch(() => {
        // ignore — server treats null fp_id as "anonymous"
      })

    return () => {
      cancelled = true
    }
  }, [])

  return fpId
}

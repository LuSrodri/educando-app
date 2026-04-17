"use client"

import { useEffect, useRef } from "react"

const SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
const SCRIPT_ID = "cf-turnstile-script"

declare global {
  interface Window {
    turnstile?: {
      render: (
        el: HTMLElement,
        opts: {
          sitekey: string
          size?: "normal" | "flexible" | "compact" | "invisible"
          theme?: "light" | "dark" | "auto"
          appearance?: "always" | "execute" | "interaction-only"
          callback?: (token: string) => void
          "error-callback"?: (code: string) => void
          "expired-callback"?: () => void
          "timeout-callback"?: () => void
        },
      ) => string
      execute: (widgetId: string) => void
      reset: (widgetId: string) => void
      remove: (widgetId: string) => void
    }
  }
}

let scriptLoaded: Promise<void> | null = null

function ensureScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve()
  if (window.turnstile) return Promise.resolve()
  if (scriptLoaded) return scriptLoaded

  scriptLoaded = new Promise((resolve, reject) => {
    const existing = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null
    if (existing) {
      existing.addEventListener("load", () => resolve())
      existing.addEventListener("error", () => reject(new Error("turnstile_script_error")))
      return
    }
    const script = document.createElement("script")
    script.id = SCRIPT_ID
    script.src = SCRIPT_SRC
    script.async = true
    script.defer = true
    script.addEventListener("load", () => resolve())
    script.addEventListener("error", () => reject(new Error("turnstile_script_error")))
    document.head.appendChild(script)
  })

  return scriptLoaded
}

interface TurnstileWidgetProps {
  onToken: (token: string) => void
  onError?: () => void
}

/**
 * Renders an invisible Turnstile challenge. The widget solves itself in the
 * background; the token arrives via `onToken`. Rotates automatically when the
 * parent calls the child's ref (exposed here by re-rendering with a new key).
 */
export function TurnstileWidget({ onToken, onError }: TurnstileWidgetProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const widgetIdRef = useRef<string | null>(null)
  const siteKey = process.env.NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY

  useEffect(() => {
    if (!siteKey || !containerRef.current) return
    let cancelled = false

    ensureScript()
      .then(() => {
        if (cancelled || !containerRef.current || !window.turnstile) return
        const id = window.turnstile.render(containerRef.current, {
          sitekey: siteKey,
          size: "invisible",
          appearance: "interaction-only",
          callback: (token) => onToken(token),
          "error-callback": () => onError?.(),
          "expired-callback": () => onError?.(),
          "timeout-callback": () => onError?.(),
        })
        widgetIdRef.current = id
      })
      .catch(() => onError?.())

    return () => {
      cancelled = true
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current)
        } catch {
          // ignore
        }
        widgetIdRef.current = null
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [siteKey])

  if (!siteKey) return null
  return <div ref={containerRef} aria-hidden className="hidden" />
}

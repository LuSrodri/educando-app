"use client"

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react"

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

export interface TurnstileWidgetHandle {
  /** Runs the challenge and resolves with a fresh token. Falls back to the
   * cached token if the widget has already produced one. */
  getToken(timeoutMs?: number): Promise<string | null>
}

interface TurnstileWidgetProps {
  onToken: (token: string) => void
  onError?: (code?: string) => void
}

export const TurnstileWidget = forwardRef<TurnstileWidgetHandle, TurnstileWidgetProps>(
  function TurnstileWidget({ onToken, onError }, ref) {
    const containerRef = useRef<HTMLDivElement | null>(null)
    const widgetIdRef = useRef<string | null>(null)
    const tokenRef = useRef<string | null>(null)
    const pendingResolversRef = useRef<Array<(token: string) => void>>([])
    const siteKey = process.env.NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY

    useEffect(() => {
      if (!siteKey || !containerRef.current) return
      let cancelled = false

      ensureScript()
        .then(() => {
          if (cancelled || !containerRef.current || !window.turnstile) return
          const id = window.turnstile.render(containerRef.current, {
            sitekey: siteKey,
            // Auto-resolves in the background. No `appearance` override so
            // Cloudflare picks the default (managed / interaction only when
            // necessary).
            size: "invisible",
            callback: (token) => {
              tokenRef.current = token
              onToken(token)
              const pending = pendingResolversRef.current
              pendingResolversRef.current = []
              pending.forEach((resolve) => resolve(token))
            },
            "error-callback": (code) => {
              tokenRef.current = null
              console.warn("[turnstile] error-callback", code)
              onError?.(code)
            },
            "expired-callback": () => {
              tokenRef.current = null
              onError?.("expired")
              if (widgetIdRef.current && window.turnstile) {
                try {
                  window.turnstile.reset(widgetIdRef.current)
                } catch {
                  // ignore
                }
              }
            },
            "timeout-callback": () => {
              tokenRef.current = null
              onError?.("timeout")
            },
          })
          widgetIdRef.current = id
        })
        .catch((err) => {
          console.warn("[turnstile] script load failed", err)
          onError?.("script_error")
        })

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
        pendingResolversRef.current = []
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [siteKey])

    useImperativeHandle(
      ref,
      () => ({
        async getToken(timeoutMs = 8000) {
          if (!siteKey) return null
          if (tokenRef.current) return tokenRef.current

          // Ask Cloudflare to (re)run the challenge if the widget is already
          // mounted, so a stalled widget gets a nudge.
          try {
            if (widgetIdRef.current && window.turnstile) {
              window.turnstile.execute(widgetIdRef.current)
            }
          } catch {
            // ignore — fall through to the pending-resolver path
          }

          return new Promise<string | null>((resolve) => {
            const timer = setTimeout(() => {
              const idx = pendingResolversRef.current.indexOf(wrapped)
              if (idx >= 0) pendingResolversRef.current.splice(idx, 1)
              resolve(null)
            }, timeoutMs)
            const wrapped = (token: string) => {
              clearTimeout(timer)
              resolve(token)
            }
            pendingResolversRef.current.push(wrapped)
          })
        },
      }),
      [siteKey],
    )

    if (!siteKey) return null
    return <div ref={containerRef} aria-hidden className="hidden" />
  },
)

"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { getSupabaseBrowserClient } from "@/lib/supabase/ssr-client"

interface Props {
  next?: string
  className?: string
}

const GOOGLE_LOGO = (
  <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
    <path
      fill="#EA4335"
      d="M12 10.2v3.9h5.5c-.24 1.4-.97 2.59-2.07 3.39v2.81h3.35c1.96-1.81 3.09-4.47 3.09-7.62 0-.74-.07-1.45-.19-2.13H12z"
    />
    <path
      fill="#34A853"
      d="M12 22c2.7 0 4.97-.9 6.62-2.43l-3.35-2.81c-.93.62-2.12.99-3.27.99-2.51 0-4.64-1.69-5.4-3.97H3.13v2.5C4.78 19.94 8.13 22 12 22z"
    />
    <path
      fill="#FBBC05"
      d="M6.6 13.78A6.02 6.02 0 0 1 6.27 12c0-.62.11-1.22.31-1.78V7.72H3.13A10 10 0 0 0 2 12c0 1.62.39 3.15 1.13 4.28l3.47-2.5z"
    />
    <path
      fill="#4285F4"
      d="M12 6.07c1.47 0 2.79.51 3.83 1.5l2.87-2.87C16.97 3.07 14.7 2 12 2 8.13 2 4.78 4.06 3.13 7.72l3.47 2.5C7.36 7.76 9.49 6.07 12 6.07z"
    />
  </svg>
)

export function GoogleSignInButton({ next, className }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleClick() {
    setLoading(true)
    setError(null)
    try {
      const supabase = getSupabaseBrowserClient()
      const callback = new URL("/auth/callback", window.location.origin)
      if (next) callback.searchParams.set("next", next)

      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: callback.toString(),
          queryParams: { prompt: "select_account" },
        },
      })
      if (authError) throw authError
      // Em caso de sucesso, o browser redireciona pro Google.
    } catch (err) {
      setError((err as Error).message ?? "Não foi possível iniciar o login.")
      setLoading(false)
    }
  }

  return (
    <div className={className}>
      <Button
        type="button"
        size="lg"
        variant="outline"
        onClick={handleClick}
        disabled={loading}
        className="w-full justify-center gap-3 border-amber-200 bg-white text-gray-800 shadow-sm hover:bg-amber-50"
      >
        {loading ? (
          <span className="text-sm">Redirecionando…</span>
        ) : (
          <>
            {GOOGLE_LOGO}
            <span className="text-sm font-medium">Continuar com Google</span>
          </>
        )}
      </Button>
      {error && (
        <p className="mt-3 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}

"use client"

import { useState, useEffect } from "react"

const ANALYTICS_CONSENT_KEY = "educando_analytics_consent"

export function ConsentBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!localStorage.getItem(ANALYTICS_CONSENT_KEY)) {
      setVisible(true)
    }
  }, [])

  const accept = () => {
    localStorage.setItem(ANALYTICS_CONSENT_KEY, "true")
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div
      role="banner"
      aria-label="Aviso de privacidade"
      className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-amber-100 px-4 py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
    >
      <p className="text-sm text-gray-600">
        O <span className="text-gray-900 font-semibold">educando.app</span> usa{" "}
        <span className="text-gray-900 font-semibold">tecnologias de terceiros</span> para coletar dados
        de uso anônimos (páginas visitadas, tempo de acesso) e melhorar o serviço.{" "}
        <span className="text-gray-500">
          Ao continuar navegando, você concorda com essa coleta.
        </span>
      </p>
      <button
        onClick={accept}
        className="shrink-0 bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold px-5 py-2 rounded-lg transition-colors cursor-pointer"
      >
        Entendido
      </button>
    </div>
  )
}

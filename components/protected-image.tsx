"use client"

import { useEffect, useRef } from "react"

interface Props {
  src: string
  alt: string
  className?: string
}

/**
 * Renderiza uma <img> protegida contra download casual:
 *   - CSS .protected-image desabilita seleção, drag e long-press
 *   - Listener contextmenu impede o menu "Salvar imagem como…"
 * O wrapper precisa interceptar o contextmenu porque pointer-events:none
 * no <img> impede o evento de chegar nele diretamente.
 */
export function ProtectedImage({ src, alt, className }: Props) {
  const wrapperRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = wrapperRef.current
    if (!el) return
    function block(e: Event) {
      e.preventDefault()
    }
    el.addEventListener("contextmenu", block)
    return () => {
      el.removeEventListener("contextmenu", block)
    }
  }, [])

  return (
    <div ref={wrapperRef} className="select-none">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        draggable={false}
        className={`protected-image ${className ?? ""}`}
      />
    </div>
  )
}

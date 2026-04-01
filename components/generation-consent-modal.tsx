"use client"

import { Shield, Database, ImageIcon, Users, X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface GenerationConsentModalProps {
  onAccept: () => void
  onDecline: () => void
}

export function GenerationConsentModal({ onAccept, onDecline }: GenerationConsentModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
      onClick={onDecline}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4 max-h-[calc(100dvh-2rem)] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="consent-modal-title"
      >
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center shrink-0">
              <Shield className="w-5 h-5 text-amber-600" aria-hidden="true" />
            </div>
            <h2 id="consent-modal-title" className="text-lg font-bold text-gray-900 font-heading">
              Antes de gerar sua atividade
            </h2>
          </div>
          <button
            onClick={onDecline}
            className="p-1 rounded-lg hover:bg-gray-100 cursor-pointer"
            aria-label="Fechar e cancelar"
          >
            <X className="w-4 h-4 text-gray-500" aria-hidden="true" />
          </button>
        </div>

        {/* Intro */}
        <p className="text-sm text-gray-600">
          Para gerar e salvar sua atividade, precisamos armazenar alguns dados. Veja exatamente o
          que é coletado:
        </p>

        {/* Data items */}
        <div className="space-y-3 bg-gray-50 rounded-xl p-4">
          <div className="flex gap-3">
            <Database className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <p className="text-sm font-semibold text-gray-800">ID anônimo do navegador</p>
              <p className="text-xs text-gray-500">
                Um código único gerado localmente para controlar o uso das atividades gratuitas.
                Sem nome, e-mail ou login.
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <ImageIcon className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <p className="text-sm font-semibold text-gray-800">Texto e imagem da atividade</p>
              <p className="text-xs text-gray-500">
                O que você digitou e a imagem gerada ficam salvos em nosso servidor para você
                acessar depois. Evite incluir nomes de alunos ou dados pessoais no texto.
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <Users className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <p className="text-sm font-semibold text-gray-800">Exibição na galeria pública</p>
              <p className="text-xs text-gray-500">
                Sua atividade poderá aparecer na galeria da comunidade do educando.app para inspirar
                outros professores.
              </p>
            </div>
          </div>
        </div>

        <p className="text-xs text-gray-400">
          Não coletamos dados pessoais identificáveis. Ao aceitar, você concorda com o armazenamento
          descrito acima. Esta confirmação é pedida apenas uma vez.
        </p>

        {/* Actions */}
        <div className="flex flex-col gap-2 pt-1">
          <Button
            onClick={onAccept}
            className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold cursor-pointer"
          >
            Aceitar e Gerar Atividade
          </Button>
          <button
            onClick={onDecline}
            className="text-xs text-gray-400 hover:text-gray-600 py-1.5 cursor-pointer transition-colors"
          >
            Cancelar — não gerar agora
          </button>
        </div>
      </div>
    </div>
  )
}

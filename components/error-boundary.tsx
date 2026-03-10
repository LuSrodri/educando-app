"use client"

import { Component, type ReactNode } from "react"
import { AlertTriangle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-amber-50">
          <div className="text-center max-w-sm">
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-amber-600" aria-hidden="true" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2 font-heading">
              Algo deu errado
            </h2>
            <p className="text-gray-600 text-sm mb-6">
              Ocorreu um erro inesperado. Tente recarregar a página.
            </p>
            <Button
              onClick={() => window.location.reload()}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              <RefreshCw className="w-4 h-4 mr-2" aria-hidden="true" />
              Recarregar página
            </Button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

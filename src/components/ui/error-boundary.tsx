"use client"

import { Component, type ReactNode } from "react"
import { AlertTriangle, RefreshCw } from "lucide-react"
import Button from "./button"

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback
      return (
        <div className="flex items-center justify-center min-h-[400px] bg-[var(--bg-primary)]">
          <div className="text-center max-w-md mx-auto px-4">
            <div className="w-16 h-16 rounded-2xl bg-red-100 flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">Une erreur est survenue</h2>
            <p className="text-[var(--text-secondary)] mb-6">Un problème inattendu s'est produit. Veuillez réessayer.</p>
            <Button onClick={() => { this.setState({ hasError: false }); window.location.reload() }}>
              <RefreshCw className="w-4 h-4" /> Rafraîchir la page
            </Button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

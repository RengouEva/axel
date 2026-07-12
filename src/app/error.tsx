"use client"

import { AlertTriangle, RefreshCw } from "lucide-react"
import Button from "@/components/ui/button"

export default function RootError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="flex items-center justify-center min-h-screen bg-[var(--bg-primary)]">
      <div className="text-center max-w-lg mx-auto px-4">
        <div className="w-16 h-16 rounded-2xl bg-red-100 flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="w-8 h-8 text-red-600" />
        </div>
        <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">Une erreur est survenue</h2>
        <p className="text-[var(--text-secondary)] mb-4">Veuillez réessayer ou revenir à l'accueil.</p>
        <div className="mb-6 p-4 bg-red-50 rounded-lg text-left" style={{ fontFamily: "monospace", fontSize: "12px", wordBreak: "break-word", maxHeight: "200px", overflow: "auto" }}>
          <strong style={{ color: "#991b1b" }}>{error.name}: </strong>
          <span style={{ color: "#7f1d1d" }}>{error.message}</span>
          {error.digest && <p style={{ color: "#888", marginTop: "4px" }}>Digest: {error.digest}</p>}
        </div>
        <div className="flex gap-3 justify-center">
          <Button onClick={reset}><RefreshCw className="w-4 h-4" /> Réessayer</Button>
          <Button variant="outline" onClick={() => window.location.href = "/"}>Accueil</Button>
        </div>
      </div>
    </div>
  )
}

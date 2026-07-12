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
        <pre style={{ background: "#fee", padding: "1rem", borderRadius: "8px", textAlign: "left", fontSize: "14px", whiteSpace: "pre-wrap", wordBreak: "break-all", marginBottom: "1rem", border: "1px solid #fcc" }}>{(error && (error.message || error.name || typeof error === "string")) ? (typeof error === "string" ? error : error.name + ": " + error.message) : "Aucun détail disponible"}</pre>
        <div className="flex gap-3 justify-center">
          <Button onClick={reset}><RefreshCw className="w-4 h-4" /> Réessayer</Button>
          <Button variant="outline" onClick={() => window.location.href = "/"}>Accueil</Button>
        </div>
      </div>
    </div>
  )
}

"use client"

import { useState, useEffect } from "react"
import { Brain, Lightbulb, TrendingUp, Sparkles, Check, X } from "lucide-react"
import Button from "@/components/ui/button"
import toast from "react-hot-toast"

export default function AiPage() {
  const [recommendations, setRecommendations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [analyzing, setAnalyzing] = useState(false)
  const [filter, setFilter] = useState<string | undefined>(undefined)

  const loadRecs = async () => {
    const url = filter ? `/api/vendeur/services-pro/ai?type=${filter}` : "/api/vendeur/services-pro/ai"
    const res = await fetch(url).then(r => r.json())
    setRecommendations(res.recommendations || [])
    setLoading(false)
  }

  useEffect(() => { loadRecs() }, [filter])

  const runAnalysis = async () => {
    setAnalyzing(true)
    try {
      const res = await fetch("/api/vendeur/services-pro/ai", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "analyze_product" }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error); return }
      toast.success(data.message)
      loadRecs()
    } catch { toast.error("Erreur") } finally { setAnalyzing(false) }
  }

  const handleAction = async (id: number, action: string) => {
    const res = await fetch("/api/vendeur/services-pro/ai", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, id }),
    })
    const data = await res.json()
    if (!res.ok) { toast.error(data.error); return }
    toast.success(action === "apply" ? "Recommandation appliquée" : "Recommandation ignorée")
    loadRecs()
  }

  const typeColors: Record<string, string> = {
    price: "#10B981", optimization: "#8B5CF6", publishing: "#F59E0B",
    sales_forecast: "#1769F2", detection: "#EF4444",
  }
  const typeLabels: Record<string, string> = {
    price: "Prix", optimization: "Optimisation", publishing: "Publication",
    sales_forecast: "Prévisions", detection: "Détection",
  }
  const typeIcons: Record<string, any> = {
    price: TrendingUp, optimization: Sparkles, publishing: Lightbulb,
    sales_forecast: TrendingUp, detection: Brain,
  }

  if (loading) return <div className="w-full min-h-screen bg-[var(--bg-secondary)] flex items-center justify-center"><p className="text-[var(--text-secondary)]">Chargement...</p></div>

  return (
    <div className="w-full min-h-screen bg-[var(--bg-secondary)] p-6">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Brain className="w-8 h-8 text-[var(--text-link)]" />
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">Assistant IA</h1>
            <p className="text-sm text-[var(--text-secondary)]">Recommandations intelligentes pour optimiser votre activité</p>
          </div>
        </div>

        <div className="flex items-center gap-4 mb-6">
          <Button onClick={runAnalysis} disabled={analyzing}>
            <Sparkles className="w-4 h-4" /> {analyzing ? "Analyse en cours..." : "Lancer l'analyse"}
          </Button>
          <div className="flex gap-2">
            <button onClick={() => { setFilter(undefined); setLoading(true) }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium ${!filter ? "bg-[var(--text-link)] text-white" : "bg-[var(--bg-primary)] text-[var(--text-secondary)] border border-[var(--border)]"}`}>Toutes</button>
            {Object.entries(typeLabels).map(([k, v]) => (
              <button key={k} onClick={() => { setFilter(k); setLoading(true) }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium ${filter === k ? "bg-[var(--text-link)] text-white" : "bg-[var(--bg-primary)] text-[var(--text-secondary)] border border-[var(--border)]"}`}>{v}</button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          {recommendations.map((rec: any) => {
            const Icon = typeIcons[rec.type] || Brain
            const color = typeColors[rec.type] || "#64748B"
            return (
              <div key={rec.id} className="bg-[var(--bg-primary)] rounded-2xl border-2 border-[var(--border)] p-5">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${color}15` }}>
                    <Icon className="w-5 h-5" style={{ color }} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: `${color}15`, color }}>
                        {typeLabels[rec.type]}
                      </span>
                      <span className="text-xs text-[var(--text-secondary)]">Confiance: {rec.confidence}%</span>
                    </div>
                    <h3 className="font-semibold text-sm text-[var(--text-primary)]">{rec.title}</h3>
                    {rec.description && <p className="text-sm text-[var(--text-secondary)] mt-1">{rec.description}</p>}
                    <div className="flex gap-2 mt-3">
                      <button onClick={() => handleAction(rec.id, "apply")}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-green-500/10 text-green-400 text-xs font-semibold hover:bg-green-500/20">
                        <Check className="w-3 h-3" /> Appliquer
                      </button>
                      <button onClick={() => handleAction(rec.id, "dismiss")}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gray-500/10 text-gray-400 text-xs font-semibold hover:bg-gray-500/20">
                        <X className="w-3 h-3" /> Ignorer
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
          {recommendations.length === 0 && (
            <div className="text-center py-12">
              <Brain className="w-12 h-12 text-[var(--text-secondary)]/50 mx-auto mb-4" />
              <p className="text-[var(--text-secondary)]">Aucune recommandation pour le moment</p>
              <p className="text-sm text-[var(--text-muted)]">Lancez une analyse pour obtenir des suggestions</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

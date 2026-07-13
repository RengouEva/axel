"use client"

import { useState, useEffect } from "react"
import { Loader2, AlertTriangle, Shield, Flag, Eye } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import Button from "@/components/ui/button"

export default function AdminFraudPage() {
  const { getAuthHeaders } = useAuth()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const fetchFraud = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/ads/fraud", { headers: getAuthHeaders() })
      if (res.ok) setData(await res.json())
    } catch {}
    setLoading(false)
  }

  useEffect(() => { fetchFraud() }, [getAuthHeaders])

  const markFraudulent = async (clickId: string) => {
    try {
      await fetch(`/api/ads/fraud?action=mark_fraudulent&clickId=${clickId}`, {
        headers: getAuthHeaders(),
      })
      await fetchFraud()
    } catch {}
  }

  if (loading) return <div className="p-8 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-[var(--text-link)]" /></div>

  return (
    <div className="p-4 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Détection de fraude</h1>
          <p className="text-sm text-[var(--text-secondary)]">Surveillance des clics frauduleux</p>
        </div>
        <Button variant="outline" onClick={fetchFraud}><Shield className="w-4 h-4" /> Actualiser</Button>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border)]">
          <AlertTriangle className="w-5 h-5 text-amber-500 mb-3" />
          <p className="text-2xl font-bold text-[var(--text-primary)]">{data?.totalRecentClicks || 0}</p>
          <p className="text-xs text-[var(--text-secondary)]">Clics (dernière heure)</p>
        </div>
        <div className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border)]">
          <Flag className="w-5 h-5 text-red-500 mb-3" />
          <p className="text-2xl font-bold text-[var(--text-primary)]">{data?.fraudCandidates?.length || 0}</p>
          <p className="text-xs text-[var(--text-secondary)]">IP suspectes</p>
        </div>
        <div className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border)]">
          <Shield className="w-5 h-5 text-green-500 mb-3" />
          <p className="text-2xl font-bold text-[var(--text-primary)]">{data?.flagged || 0}</p>
          <p className="text-xs text-[var(--text-secondary)]">Signalés</p>
        </div>
      </div>

      {data?.fraudCandidates?.length > 0 ? (
        <div className="space-y-4">
          {data.fraudCandidates.map((candidate: any) => (
            <div key={candidate.ip} className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border)]">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Shield className={`w-4 h-4 ${candidate.risk === "high" ? "text-red-500" : candidate.risk === "medium" ? "text-amber-500" : "text-yellow-500"}`} />
                  <span className="font-bold text-[var(--text-primary)]">IP: {candidate.ip || "Inconnue"}</span>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  candidate.risk === "high" ? "bg-red-100 text-red-700" :
                  candidate.risk === "medium" ? "bg-amber-100 text-amber-700" :
                  "bg-yellow-100 text-yellow-700"
                }`}>
                  {candidate.risk === "high" ? "Risque élevé" : candidate.risk === "medium" ? "Risque moyen" : "Risque faible"}
                </span>
              </div>
              <p className="text-sm text-[var(--text-secondary)] mb-3">{candidate.clickCount} clics suspects</p>
              {candidate.clicks?.map((click: any) => (
                <div key={click.id} className="flex items-center justify-between p-2 rounded-lg bg-[var(--bg-elevated)] text-xs mb-1">
                  <span className="text-[var(--text-secondary)]">{click.campaignName || "N/A"}</span>
                  <span className="text-[var(--text-muted)]">{click.createdAt ? new Date(click.createdAt).toLocaleString("fr-FR") : "-"}</span>
                  {!click.fraudulent && (
                    <button onClick={() => markFraudulent(click.id)} className="text-red-500 hover:text-red-700 font-semibold">
                      Marquer frauduleux
                    </button>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 text-[var(--text-secondary)]">
          <Shield className="w-16 h-16 mx-auto mb-4 text-green-500/50" />
          <p>Aucune activité suspecte détectée</p>
        </div>
      )}
    </div>
  )
}

"use client"

import { useState, useEffect, useCallback } from "react"
import { BarChart3, FileDown, Calendar, FileText } from "lucide-react"
import Button from "@/components/ui/button"
import toast from "react-hot-toast"
import { useAuth } from "@/lib/auth-context"

export default function ReportsPage() {
  const { getAuthHeaders } = useAuth()
  const [reports, setReports] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [type, setType] = useState<string | undefined>(undefined)

  const loadReports = useCallback(async () => {
    setLoading(true)
    const url = type ? `/api/vendeur/services-pro/reports?type=${type}` : "/api/vendeur/services-pro/reports"
    try {
      const res = await fetch(url, { headers: getAuthHeaders() })
      const data = await res.json()
      setReports(data.reports || [])
    } catch {
      setReports([])
    } finally {
      setLoading(false)
    }
  }, [type, getAuthHeaders])

  useEffect(() => { loadReports() }, [loadReports])

  const generateReport = async (reportType: string) => {
    const res = await fetch("/api/vendeur/services-pro/reports", {
      method: "POST", headers: { "Content-Type": "application/json", ...getAuthHeaders() },
      body: JSON.stringify({ type: reportType }),
    })
    const data = await res.json()
    if (!res.ok) { toast.error(data.error); return }
    toast.success("Rapport généré")
    loadReports()
  }

  const exportReport = (report: any) => {
    const blob = new Blob([JSON.stringify(report.data || report, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `rapport-${report.type}-${report.period || report.id}.json`
    a.click()
    URL.revokeObjectURL(url)
    toast.success("Rapport exporté")
  }

  const typeLabels: Record<string, string> = {
    daily: "Quotidien", weekly: "Hebdomadaire", monthly: "Mensuel", yearly: "Annuel",
  }

  if (loading) return <div className="w-full min-h-screen bg-[var(--bg-secondary)] flex items-center justify-center"><p className="text-[var(--text-secondary)]">Chargement...</p></div>

  return (
    <div className="w-full min-h-screen bg-[var(--bg-secondary)] p-6">
      <div className="flex items-center gap-3 mb-6">
        <BarChart3 className="w-8 h-8 text-[var(--text-link)]" />
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Rapports</h1>
          <p className="text-sm text-[var(--text-secondary)]">Générez et exportez vos rapports d'activité</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {["daily", "weekly", "monthly", "yearly"].map(t => (
          <button key={t} onClick={() => generateReport(t)}
            className="p-4 rounded-2xl bg-[var(--bg-primary)] border-2 border-[var(--border)] hover:border-[var(--border-hover)] text-center transition-all">
            <Calendar className="w-6 h-6 text-[var(--text-link)] mx-auto mb-2" />
            <p className="font-semibold text-sm text-[var(--text-primary)]">Rapport {typeLabels[t]}</p>
            <p className="text-xs text-[var(--text-secondary)]">Générer maintenant</p>
          </button>
        ))}
      </div>

      <div className="flex gap-2 mb-4 flex-wrap">
        <button onClick={() => setType(undefined)}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium ${!type ? "bg-[var(--text-link)] text-white" : "bg-[var(--bg-primary)] text-[var(--text-secondary)] border border-[var(--border)]"}`}>Tous</button>
        {["daily", "weekly", "monthly", "yearly"].map(t => (
          <button key={t} onClick={() => setType(t)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium ${type === t ? "bg-[var(--text-link)] text-white" : "bg-[var(--bg-primary)] text-[var(--text-secondary)] border border-[var(--border)]"}`}>{typeLabels[t]}</button>
        ))}
      </div>

      <div className="bg-[var(--bg-primary)] rounded-2xl border-2 border-[var(--border)] p-6">
        <div className="space-y-3">
          {reports.map((r: any) => (
            <div key={r.id} className="flex items-center justify-between p-4 rounded-xl bg-[var(--bg-secondary)]">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-[var(--text-link)]" />
                <div>
                  <p className="font-semibold text-sm text-[var(--text-primary)]">Rapport {typeLabels[r.type]} - {r.period}</p>
                  <p className="text-xs text-[var(--text-secondary)]">{new Date(r.generatedAt).toLocaleDateString("fr-FR")} • {Number(r.data?.revenue || 0).toLocaleString("fr-FR")} F</p>
                </div>
              </div>
              <button onClick={() => exportReport(r)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[var(--text-link)]/10 text-[var(--text-link)] text-xs font-semibold">
                <FileDown className="w-3 h-3" /> Exporter
              </button>
            </div>
          ))}
          {reports.length === 0 && <p className="text-sm text-[var(--text-secondary)] text-center py-4">Aucun rapport généré</p>}
        </div>
      </div>
    </div>
  )
}

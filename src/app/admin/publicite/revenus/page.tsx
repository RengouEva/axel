"use client"

import { useState, useEffect } from "react"
import { Loader2, DollarSign, TrendingUp, BarChart3, Download } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import Button from "@/components/ui/button"

export default function AdminRevenuePage() {
  const { getAuthHeaders } = useAuth()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/ads/admin?action=overview", { headers: getAuthHeaders() })
      .then(r => r.json())
      .then(d => setData(d))
      .finally(() => setLoading(false))
  }, [getAuthHeaders])

  if (loading) return <div className="p-8 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-[var(--text-link)]" /></div>

  const totals = data?.totals || {}

  return (
    <div className="p-4 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Revenus publicitaires</h1>
          <p className="text-sm text-[var(--text-secondary)]">Suivi des revenus générés par Axel Ads</p>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border)]">
          <DollarSign className="w-5 h-5 text-green-500 mb-3" />
          <p className="text-3xl font-black text-[var(--text-primary)]">{(data?.revenue || 0).toLocaleString("fr-FR")} F</p>
          <p className="text-xs text-[var(--text-secondary)]">Revenus totaux</p>
        </div>
        <div className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border)]">
          <TrendingUp className="w-5 h-5 text-blue-500 mb-3" />
          <p className="text-3xl font-black text-[var(--text-primary)]">{Number(totals.totalSpent || 0).toLocaleString("fr-FR")} F</p>
          <p className="text-xs text-[var(--text-secondary)]">Dépensé total</p>
        </div>
        <div className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border)]">
          <BarChart3 className="w-5 h-5 text-purple-500 mb-3" />
          <p className="text-3xl font-black text-[var(--text-primary)]">{totals.totalCampaigns || 0}</p>
          <p className="text-xs text-[var(--text-secondary)]">Campagnes</p>
        </div>
        <div className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border)]">
          <DollarSign className="w-5 h-5 text-amber-500 mb-3" />
          <p className="text-3xl font-black text-[var(--text-primary)]">{Number(totals.totalBudget || 0).toLocaleString("fr-FR")} F</p>
          <p className="text-xs text-[var(--text-secondary)]">Budget total alloué</p>
        </div>
      </div>

      <div className="rounded-2xl bg-[var(--bg-card)] border border-[var(--border)] p-6">
        <h3 className="text-sm font-bold text-[var(--text-primary)] mb-4">Résumé financier</h3>
        <div className="space-y-3 text-sm">
          {[
            ["Budget total", `${Number(totals.totalBudget || 0).toLocaleString("fr-FR")} F`],
            ["Dépensé total", `${Number(totals.totalSpent || 0).toLocaleString("fr-FR")} F`],
            ["Taux d'utilisation", totals.totalBudget > 0 ? `${((totals.totalSpent / totals.totalBudget) * 100).toFixed(1)}%` : "0%"],
            ["Revenus générés", `${(data?.revenue || 0).toLocaleString("fr-FR")} F`],
            ["Ventes générées", `${totals.totalSales || 0}`],
            ["Ajouts panier", `${totals.totalCartAdds || 0}`],
          ].map(([label, value]) => (
            <div key={label} className="flex justify-between py-2 border-b border-[var(--border)] last:border-0">
              <span className="text-[var(--text-secondary)]">{label}</span>
              <span className="font-semibold text-[var(--text-primary)]">{value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

"use client"

import { useState, useEffect } from "react"
import {
  Megaphone, TrendingUp, Eye, MousePointerClick, DollarSign,
  AlertTriangle, CheckCircle, XCircle, Loader2
} from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import Link from "next/link"
import { CAMPAIGN_TYPE_LABELS, STATUS_LABELS, type CampaignType, type CampaignStatus } from "@/lib/ads"

export default function AdminAdsDashboard() {
  const { getAuthHeaders } = useAuth()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/ads/admin?action=overview", { headers: getAuthHeaders() })
      .then(r => r.json())
      .then(d => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [getAuthHeaders])

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--text-link)]" />
      </div>
    )
  }

  const totals = data?.totals || {}

  const stats = [
    { icon: Megaphone, label: "Campagnes", value: totals.totalCampaigns || 0, sub: `${totals.activeCampaigns || 0} actives`, color: "#1769F2", href: "/admin/publicite/campagnes" },
    { icon: Eye, label: "Impressions", value: (totals.totalImpressions || 0).toLocaleString("fr-FR"), sub: "totales", color: "#059669", href: "/admin/publicite/campagnes" },
    { icon: MousePointerClick, label: "Clics", value: (totals.totalClicks || 0).toLocaleString("fr-FR"), sub: "totaux", color: "#D97706", href: "/admin/publicite/campagnes" },
    { icon: DollarSign, label: "Revenus", value: `${(data?.revenue || 0).toLocaleString("fr-FR")} F`, sub: "générés", color: "#8B5CF6", href: "/admin/publicite/revenus" },
    { icon: AlertTriangle, label: "Fraude", value: data?.fraudCount || 0, sub: "clics suspects", color: "#DC2626", href: "/admin/publicite/signalees" },
    { icon: CheckCircle, label: "Emplacements", value: data?.activePlacements || 0, sub: "actifs", color: "#EC4899", href: "/admin/publicite/emplacements" },
  ]

  return (
    <div className="p-4 lg:p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Publicité - Tableau de bord</h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">Gérez la plateforme publicitaire Axel Ads</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {stats.map((s) => {
          const Icon = s.icon
          return (
            <Link key={s.label} href={s.href} className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border)] hover:border-[var(--border-hover)]/30 transition-all">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4" style={{ backgroundColor: `${s.color}15` }}>
                <Icon className="w-5 h-5" style={{ color: s.color }} />
              </div>
              <p className="text-2xl font-bold text-[var(--text-primary)]">{s.value}</p>
              <p className="text-xs text-[var(--text-secondary)]">{s.label}</p>
              <p className="text-[10px] text-[var(--text-muted)] mt-0.5">{s.sub}</p>
            </Link>
          )
        })}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="rounded-2xl bg-[var(--bg-card)] border border-[var(--border)] p-6">
          <h3 className="text-sm font-bold text-[var(--text-primary)] mb-4">Top campagnes</h3>
          {data?.topCampaigns?.length > 0 ? (
            <div className="space-y-2">
              {data.topCampaigns.slice(0, 5).map((c: any) => (
                <div key={c.id} className="flex items-center justify-between p-3 rounded-xl bg-[var(--bg-elevated)]">
                  <div>
                    <p className="text-sm font-semibold text-[var(--text-primary)]">{c.name}</p>
                    <p className="text-xs text-[var(--text-secondary)]">{c.shopName} · {CAMPAIGN_TYPE_LABELS[c.type as CampaignType]}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-[var(--text-primary)]">{Number(c.spent || 0).toLocaleString("fr-FR")} F</p>
                    <span className={`text-xs font-semibold ${STATUS_LABELS[c.status as CampaignStatus] === "Active" ? "text-green-400" : "text-[var(--text-secondary)]"}`}>
                      {STATUS_LABELS[c.status as CampaignStatus]}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-[var(--text-muted)] text-center py-8">Aucune campagne</p>
          )}
        </div>

        <div className="rounded-2xl bg-[var(--bg-card)] border border-[var(--border)] p-6">
          <h3 className="text-sm font-bold text-[var(--text-primary)] mb-4">Clics (14 jours)</h3>
          {data?.clicksByDay?.length > 0 ? (
            <div className="space-y-2">
              {data.clicksByDay.map((d: any) => (
                <div key={d.date} className="flex items-center justify-between p-2 rounded-lg bg-[var(--bg-elevated)] text-sm">
                  <span className="text-[var(--text-secondary)]">{new Date(d.date).toLocaleDateString("fr-FR")}</span>
                  <span className="font-semibold text-[var(--text-primary)]">{d.count} clics</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-[var(--text-muted)] text-center py-8">Aucune donnée</p>
          )}
        </div>
      </div>
    </div>
  )
}

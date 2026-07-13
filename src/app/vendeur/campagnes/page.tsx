"use client"

import { useState, useEffect, useCallback } from "react"
import {
  Plus, Megaphone, Search, Filter, Loader2, AlertTriangle,
  Calendar, Clock, ChevronDown, BarChart3, Pause, Play, XCircle, Eye
} from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import Button from "@/components/ui/button"
import Input from "@/components/ui/input"
import { AnimatedDiv } from "@/lib/animations"
import Link from "next/link"
import { CAMPAIGN_TYPE_LABELS, STATUS_LABELS, STATUS_COLORS, type CampaignType, type CampaignStatus } from "@/lib/ads"

export default function CampaignsPage() {
  const { getAuthHeaders } = useAuth()
  const [campaigns, setCampaigns] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [error, setError] = useState("")
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const fetchCampaigns = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (typeFilter !== "all") params.set("type", typeFilter)
      if (statusFilter !== "all") params.set("status", statusFilter)
      const res = await fetch(`/api/ads?${params}`, { headers: getAuthHeaders() })
      if (res.ok) {
        const data = await res.json()
        setCampaigns(data.campaigns || [])
      }
    } catch {}
    setLoading(false)
  }, [getAuthHeaders, typeFilter, statusFilter])

  useEffect(() => { fetchCampaigns() }, [fetchCampaigns])

  const handleAction = async (id: string, action: string) => {
    setActionLoading(id)
    setError("")
    try {
      const res = await fetch(`/api/ads/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({ status: action }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Erreur")
      }
      await fetchCampaigns()
    } catch (err: any) {
      setError(err.message)
    }
    setActionLoading(null)
  }

  const filtered = campaigns.filter((c: any) =>
    c.name?.toLowerCase().includes(search.toLowerCase())
  )

  const totalSpent = campaigns.reduce((s: number, c: any) => s + (c.spent || 0), 0)
  const totalBudget = campaigns.reduce((s: number, c: any) => s + (c.budget || 0), 0)
  const totalImpressions = campaigns.reduce((s: number, c: any) => s + (c.impressions || 0), 0)
  const totalClicks = campaigns.reduce((s: number, c: any) => s + (c.clicks || 0), 0)

  return (
    <div className="w-full min-h-screen bg-[var(--bg-secondary)]">
      <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-bold text-[var(--text-primary)]">Campagnes publicitaires</h1>
            <p className="text-[var(--text-secondary)]">Gérez vos campagnes Axel Ads</p>
          </div>
          <Link href="/vendeur/campagnes/creer">
            <Button><Plus className="w-4 h-4" /> Nouvelle campagne</Button>
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Campagnes", value: campaigns.length, color: "#1769F2" },
            { label: "Impressions", value: totalImpressions.toLocaleString("fr-FR"), color: "#059669" },
            { label: "Clics", value: totalClicks.toLocaleString("fr-FR"), color: "#D97706" },
            { label: "Dépensé", value: `${totalSpent.toLocaleString("fr-FR")} F`, color: "#DC2626" },
          ].map((s) => (
            <div key={s.label} className="p-4 rounded-2xl bg-[var(--bg-primary)] border-2 border-[var(--border)]">
              <p className="text-2xl font-bold text-[var(--text-primary)]" style={{ color: s.color }}>{s.value}</p>
              <p className="text-xs text-[var(--text-secondary)]">{s.label}</p>
            </div>
          ))}
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-red-50 border-2 border-red-200 flex items-center gap-3 text-red-700 text-sm font-medium">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            {error}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1 max-w-xs">
            <Input icon={<Search className="w-4 h-4" />} placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            className="px-4 py-2 rounded-xl bg-[var(--bg-primary)] border-2 border-[var(--border)] text-sm text-[var(--text-primary)]"
          >
            <option value="all">Tous les types</option>
            {Object.entries(CAMPAIGN_TYPE_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-4 py-2 rounded-xl bg-[var(--bg-primary)] border-2 border-[var(--border)] text-sm text-[var(--text-primary)]"
          >
            <option value="all">Tous les statuts</option>
            {Object.entries(STATUS_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-[var(--text-link)]" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <Megaphone className="w-16 h-16 text-[var(--text-secondary)]/50 mx-auto mb-4" />
            <p className="text-[var(--text-secondary)] mb-4">Aucune campagne trouvée</p>
            <Link href="/vendeur/campagnes/creer"><Button><Plus className="w-4 h-4" /> Créer une campagne</Button></Link>
          </div>
        ) : (
          <div className="bg-[var(--bg-primary)] rounded-2xl border-2 border-[var(--border)] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[var(--bg-secondary)] text-[var(--text-secondary)] text-xs uppercase tracking-wider">
                    <th className="text-left px-6 py-4 font-semibold">Campagne</th>
                    <th className="text-center px-6 py-4 font-semibold">Type</th>
                    <th className="text-center px-6 py-4 font-semibold">Budget</th>
                    <th className="text-center px-6 py-4 font-semibold">Impressions</th>
                    <th className="text-center px-6 py-4 font-semibold">Clics</th>
                    <th className="text-center px-6 py-4 font-semibold">CTR</th>
                    <th className="text-center px-6 py-4 font-semibold">Statut</th>
                    <th className="text-center px-6 py-4 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E7EB]">
                  {filtered.map((c: any) => (
                    <tr key={c.id} className="hover:bg-[var(--bg-secondary)] transition-colors">
                      <td className="px-6 py-4">
                        <Link href={`/vendeur/campagnes/${c.id}`} className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-[var(--bg-secondary)] flex items-center justify-center">
                            <Megaphone className="w-5 h-5 text-[var(--text-link)]" />
                          </div>
                          <div>
                            <p className="font-semibold text-[var(--text-primary)]">{c.name}</p>
                            <p className="text-xs text-[var(--text-secondary)]">
                              {c.startDate ? new Date(c.startDate).toLocaleDateString("fr-FR") : "-"}
                              {" → "}
                              {c.endDate ? new Date(c.endDate).toLocaleDateString("fr-FR") : "-"}
                            </p>
                          </div>
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-[var(--text-secondary)]">{CAMPAIGN_TYPE_LABELS[c.type as CampaignType] || c.type}</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="font-semibold text-[var(--text-primary)]">{Number(c.budget || 0).toLocaleString("fr-FR")} F</span>
                        {c.spent > 0 && (
                          <p className="text-xs text-[var(--text-secondary)]">{((c.spent / (c.budget || 1)) * 100).toFixed(0)}% utilisé</p>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center text-[var(--text-secondary)]">{c.impressions?.toLocaleString("fr-FR") || "0"}</td>
                      <td className="px-6 py-4 text-center text-[var(--text-primary)] font-semibold">{c.clicks || 0}</td>
                      <td className="px-6 py-4 text-center text-[var(--text-secondary)]">{c.ctr ? `${Number(c.ctr).toFixed(2)}%` : "0%"}</td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[c.status as CampaignStatus]}`}>
                          {STATUS_LABELS[c.status as CampaignStatus] || c.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Link href={`/vendeur/campagnes/${c.id}`}>
                            <button className="p-1.5 rounded-lg hover:bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-link)] transition-colors">
                              <Eye className="w-4 h-4" />
                            </button>
                          </Link>
                          {c.status === "active" && (
                            <button onClick={() => handleAction(c.id, "paused")} disabled={actionLoading === c.id} className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 hover:text-blue-700 transition-colors">
                              {actionLoading === c.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Pause className="w-4 h-4" />}
                            </button>
                          )}
                          {c.status === "paused" && (
                            <button onClick={() => handleAction(c.id, "active")} disabled={actionLoading === c.id} className="p-1.5 rounded-lg hover:bg-green-50 text-green-600 hover:text-green-700 transition-colors">
                              {actionLoading === c.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                            </button>
                          )}
                          {(c.status === "active" || c.status === "paused") && (
                            <button onClick={() => handleAction(c.id, "cancelled")} disabled={actionLoading === c.id} className="p-1.5 rounded-lg hover:bg-red-50 text-red-600 hover:text-red-700 transition-colors">
                              <XCircle className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

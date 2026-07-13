"use client"

import { useState, useEffect, useCallback } from "react"
import {
  Search, Filter, Loader2, CheckCircle, XCircle, Pause, Eye,
  Megaphone
} from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import Button from "@/components/ui/button"
import Link from "next/link"
import { CAMPAIGN_TYPE_LABELS, STATUS_LABELS, STATUS_COLORS, type CampaignType, type CampaignStatus } from "@/lib/ads"

export default function AdminCampaignsPage() {
  const { getAuthHeaders } = useAuth()
  const [campaigns, setCampaigns] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState<string>("all")

  const fetchCampaigns = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (filter !== "all") params.set("status", filter)
      const res = await fetch(`/api/ads?${params}`, { headers: getAuthHeaders() })
      if (res.ok) {
        const data = await res.json()
        setCampaigns(data.campaigns || [])
      }
    } catch {}
    setLoading(false)
  }, [getAuthHeaders, filter])

  useEffect(() => { fetchCampaigns() }, [fetchCampaigns])

  const handleAdminAction = async (campaignId: string, action: string) => {
    try {
      await fetch(`/api/ads/admin?action=${action}&campaignId=${campaignId}`, {
        method: "GET",
        headers: getAuthHeaders(),
      })
      await fetchCampaigns()
    } catch {}
  }

  const filtered = campaigns.filter((c: any) =>
    c.name?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="p-4 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Campagnes publicitaires</h1>
          <p className="text-sm text-[var(--text-secondary)]">Gérez toutes les campagnes</p>
        </div>
      </div>

      <div className="flex gap-3">
        <div className="relative max-w-xs">
          <input
            placeholder="Rechercher..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full px-4 py-2 rounded-xl bg-[var(--bg-card)] border border-[var(--border)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
          />
        </div>
        <select
          value={filter}
          onChange={e => setFilter(e.target.value)}
          className="px-4 py-2 rounded-xl bg-[var(--bg-card)] border border-[var(--border)] text-sm text-[var(--text-primary)]"
        >
          <option value="all">Tous les statuts</option>
          {Object.entries(STATUS_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-[var(--text-link)]" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-[var(--text-secondary)]">Aucune campagne trouvée</div>
      ) : (
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[var(--bg-elevated)] text-[var(--text-secondary)] text-xs uppercase">
                  <th className="text-left px-6 py-4">Campagne</th>
                  <th className="text-center px-6 py-4">Boutique</th>
                  <th className="text-center px-6 py-4">Type</th>
                  <th className="text-center px-6 py-4">Budget</th>
                  <th className="text-center px-6 py-4">Impressions</th>
                  <th className="text-center px-6 py-4">Clics</th>
                  <th className="text-center px-6 py-4">Statut</th>
                  <th className="text-center px-6 py-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {filtered.map((c: any) => (
                  <tr key={c.id} className="hover:bg-[var(--bg-elevated)] transition-colors">
                    <td className="px-6 py-4">
                      <Link href={`/admin/publicite/campagnes/${c.id}`} className="font-semibold text-[var(--text-primary)] hover:text-[var(--text-link)]">
                        {c.name}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-center text-[var(--text-secondary)]">{c.shop?.name || "-"}</td>
                    <td className="px-6 py-4 text-center text-[var(--text-secondary)]">{CAMPAIGN_TYPE_LABELS[c.type as CampaignType]}</td>
                    <td className="px-6 py-4 text-center font-semibold text-[var(--text-primary)]">{Number(c.budget || 0).toLocaleString("fr-FR")} F</td>
                    <td className="px-6 py-4 text-center text-[var(--text-secondary)]">{(c.impressions || 0).toLocaleString("fr-FR")}</td>
                    <td className="px-6 py-4 text-center text-[var(--text-primary)]">{c.clicks || 0}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[c.status as CampaignStatus]}`}>
                        {STATUS_LABELS[c.status as CampaignStatus]}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {c.status === "pending" && (
                          <>
                            <button onClick={() => handleAdminAction(c.id, "approve")} className="p-1.5 rounded-lg hover:bg-green-50 text-green-600 transition-colors" title="Approuver">
                              <CheckCircle className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleAdminAction(c.id, "reject")} className="p-1.5 rounded-lg hover:bg-red-50 text-red-600 transition-colors" title="Refuser">
                              <XCircle className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        {c.status === "active" && (
                          <button onClick={() => handleAdminAction(c.id, "suspend")} className="p-1.5 rounded-lg hover:bg-amber-50 text-amber-600 transition-colors" title="Suspendre">
                            <Pause className="w-4 h-4" />
                          </button>
                        )}
                        <Link href={`/admin/publicite/campagnes/${c.id}`}>
                          <button className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors" title="Voir">
                            <Eye className="w-4 h-4" />
                          </button>
                        </Link>
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
  )
}

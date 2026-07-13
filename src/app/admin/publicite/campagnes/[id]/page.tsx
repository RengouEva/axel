"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams } from "next/navigation"
import {
  ArrowLeft, Megaphone, Loader2, CheckCircle, XCircle, Pause,
  Eye, MousePointerClick, DollarSign, ShoppingCart, BarChart3, TrendingUp
} from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import Button from "@/components/ui/button"
import Link from "next/link"
import { CAMPAIGN_TYPE_LABELS, STATUS_LABELS, AD_SLOT_LABELS, type CampaignType } from "@/lib/ads"

export default function AdminCampaignDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { getAuthHeaders } = useAuth()
  const [campaign, setCampaign] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const fetchCampaign = useCallback(async () => {
    try {
      const res = await fetch(`/api/ads/${id}`, { headers: getAuthHeaders() })
      if (res.ok) setCampaign(await res.json())
    } catch {}
    setLoading(false)
  }, [id, getAuthHeaders])

  useEffect(() => { fetchCampaign() }, [fetchCampaign])

  const handleAction = async (action: string) => {
    try {
      await fetch(`/api/ads/admin?action=${action}&campaignId=${id}`, {
        method: "GET",
        headers: getAuthHeaders(),
      })
      await fetchCampaign()
    } catch {}
  }

  if (loading) return <div className="p-8 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-[var(--text-link)]" /></div>
  if (!campaign) return <div className="p-8 text-center text-[var(--text-secondary)]">Campagne non trouvée</div>

  const stats = [
    { icon: Eye, label: "Impressions", value: (campaign.impressions || 0).toLocaleString("fr-FR") },
    { icon: MousePointerClick, label: "Clics", value: (campaign.clicks || 0).toLocaleString("fr-FR") },
    { icon: TrendingUp, label: "CTR", value: campaign.ctr ? `${Number(campaign.ctr).toFixed(2)}%` : "0%" },
    { icon: DollarSign, label: "Budget", value: `${Number(campaign.budget || 0).toLocaleString("fr-FR")} F` },
    { icon: DollarSign, label: "Dépensé", value: `${Number(campaign.spent || 0).toLocaleString("fr-FR")} F` },
    { icon: ShoppingCart, label: "Ventes", value: (campaign.sales || 0).toLocaleString("fr-FR") },
  ]

  return (
    <div className="p-4 lg:p-8 space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/publicite/campagnes" className="p-2 rounded-xl hover:bg-[var(--bg-elevated)] text-[var(--text-secondary)]">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">{campaign.name}</h1>
          <p className="text-sm text-[var(--text-secondary)]">{CAMPAIGN_TYPE_LABELS[campaign.type as CampaignType]}</p>
        </div>
        <div className="flex gap-2">
          {campaign.status === "pending" && (
            <>
              <Button onClick={() => handleAction("approve")}><CheckCircle className="w-4 h-4" /> Approuver</Button>
              <Button variant="outline" onClick={() => handleAction("reject")} className="!text-red-500"><XCircle className="w-4 h-4" /> Refuser</Button>
            </>
          )}
          {campaign.status === "active" && (
            <Button variant="outline" onClick={() => handleAction("suspend")}><Pause className="w-4 h-4" /> Suspendre</Button>
          )}
        </div>
      </div>

      <div className="grid sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {stats.map((s) => {
          const Icon = s.icon
          return (
            <div key={s.label} className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border)]">
              <Icon className="w-4 h-4 text-[var(--text-info)] mb-2" />
              <p className="text-xl font-bold text-[var(--text-primary)]">{s.value}</p>
              <p className="text-xs text-[var(--text-secondary)]">{s.label}</p>
            </div>
          )
        })}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="rounded-2xl bg-[var(--bg-card)] border border-[var(--border)] p-6">
          <h3 className="text-sm font-bold text-[var(--text-primary)] mb-4">Détails</h3>
          <div className="space-y-3 text-sm">
            {[
              ["Statut", STATUS_LABELS[campaign.status as keyof typeof STATUS_LABELS] || campaign.status],
              ["Utilisateur", campaign.userId],
              ["Boutique", campaign.shop?.name || "-"],
              ["Produit", campaign.product?.name || "-"],
              ["Objectif", campaign.objective],
              ["Début", campaign.startDate ? new Date(campaign.startDate).toLocaleDateString("fr-FR") : "-"],
              ["Fin", campaign.endDate ? new Date(campaign.endDate).toLocaleDateString("fr-FR") : "-"],
              ["Budget journalier", `${Number(campaign.dailyBudget || 0).toLocaleString("fr-FR")} F`],
              ["Cible pays", campaign.targetCountry || "Tous"],
              ["Cible catégorie", campaign.targetCategory || "Toutes"],
              ["Score qualité", campaign.qualityScore?.toFixed(1) || "1.0"],
              ["Créée le", campaign.createdAt ? new Date(campaign.createdAt).toLocaleDateString("fr-FR") : "-"],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between">
                <span className="text-[var(--text-secondary)]">{label}</span>
                <span className="font-semibold text-[var(--text-primary)]">{String(value)}</span>
              </div>
            ))}
          </div>
        </div>

        {campaign.placements?.length > 0 && (
          <div className="rounded-2xl bg-[var(--bg-card)] border border-[var(--border)] p-6">
            <h3 className="text-sm font-bold text-[var(--text-primary)] mb-4">Emplacements</h3>
            <div className="space-y-2">
              {campaign.placements.map((p: any) => (
                <div key={p.id} className="flex items-center justify-between p-3 rounded-xl bg-[var(--bg-elevated)]">
                  <span className="text-sm text-[var(--text-primary)]">{AD_SLOT_LABELS[p.slot] || p.slot}</span>
                  <span className="text-sm font-semibold text-[var(--text-primary)]">{Number(p.bid || 0).toLocaleString("fr-FR")} F</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

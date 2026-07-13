"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import {
  ArrowLeft, Megaphone, Loader2, Pause, Play, XCircle,
  Calendar, Clock, BarChart3, TrendingUp, MousePointerClick, Eye, ShoppingCart,
  DollarSign, Target, MapPin, Tag, Percent, Zap
} from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import Button from "@/components/ui/button"
import { AnimatedDiv } from "@/lib/animations"
import Link from "next/link"
import { CAMPAIGN_TYPE_LABELS, STATUS_LABELS, AD_SLOT_LABELS, type CampaignType, type CampaignStatus } from "@/lib/ads"

export default function CampaignDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { getAuthHeaders } = useAuth()
  const [campaign, setCampaign] = useState<any>(null)
  const [performance, setPerformance] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState("")

  const fetchData = useCallback(async () => {
    try {
      const headers = getAuthHeaders()
      const [campaignRes, perfRes] = await Promise.all([
        fetch(`/api/ads/${id}`, { headers }),
        fetch(`/api/ads/stats?campaignId=${id}`, { headers }),
      ])
      if (campaignRes.ok) {
        const data = await campaignRes.json()
        setCampaign(data)
      }
      if (perfRes.ok) {
        const data = await perfRes.json()
        setPerformance(data)
      }
    } catch {}
    setLoading(false)
  }, [id, getAuthHeaders])

  useEffect(() => { fetchData() }, [fetchData])

  const handleAction = async (status: string) => {
    setActionLoading(true)
    setError("")
    try {
      const res = await fetch(`/api/ads/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Erreur")
      }
      await fetchData()
    } catch (err: any) {
      setError(err.message)
    }
    setActionLoading(false)
  }

  if (loading) {
    return (
      <div className="w-full min-h-screen bg-[var(--bg-secondary)] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--text-link)]" />
      </div>
    )
  }

  if (!campaign) {
    return (
      <div className="w-full min-h-screen bg-[var(--bg-secondary)] flex items-center justify-center">
        <p className="text-[var(--text-secondary)]">Campagne non trouvée</p>
      </div>
    )
  }

  const statsCards = [
    { icon: Eye, label: "Impressions", value: (campaign.impressions || 0).toLocaleString("fr-FR"), color: "#1769F2" },
    { icon: MousePointerClick, label: "Clics", value: (campaign.clicks || 0).toLocaleString("fr-FR"), color: "#059669" },
    { icon: TrendingUp, label: "CTR", value: campaign.ctr ? `${Number(campaign.ctr).toFixed(2)}%` : "0%", color: "#D97706" },
    { icon: DollarSign, label: "Dépensé", value: `${(campaign.spent || 0).toLocaleString("fr-FR")} F`, color: "#DC2626" },
    { icon: ShoppingCart, label: "Ajouts panier", value: (campaign.cartAdds || 0).toLocaleString("fr-FR"), color: "#8B5CF6" },
    { icon: BarChart3, label: "Ventes", value: (campaign.sales || 0).toLocaleString("fr-FR"), color: "#EC4899" },
  ]

  const daysLeft = campaign.endDate
    ? Math.max(0, Math.ceil((new Date(campaign.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0

  return (
    <div className="w-full min-h-screen bg-[var(--bg-secondary)]">
      <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center gap-3 mb-8">
          <Link href="/vendeur/campagnes">
            <button className="p-2 rounded-xl hover:bg-[var(--bg-primary)] text-[var(--text-secondary)] transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
          </Link>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-[var(--text-primary)]">{campaign.name}</h1>
            <p className="text-[var(--text-secondary)]">{CAMPAIGN_TYPE_LABELS[campaign.type as CampaignType] || campaign.type}</p>
          </div>
          <div className="flex items-center gap-2">
            {campaign.status === "active" && (
              <Button variant="outline" onClick={() => handleAction("paused")} disabled={actionLoading}>
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Pause className="w-4 h-4" />}
                Pause
              </Button>
            )}
            {campaign.status === "paused" && (
              <Button variant="outline" onClick={() => handleAction("active")} disabled={actionLoading}>
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                Reprendre
              </Button>
            )}
            {(campaign.status === "active" || campaign.status === "paused") && (
              <Button variant="outline" onClick={() => handleAction("cancelled")} disabled={actionLoading} className="!text-red-500 !border-red-200 hover:!bg-red-50">
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                Arrêter
              </Button>
            )}
          </div>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
          {statsCards.map((s) => {
            const Icon = s.icon
            return (
              <div key={s.label} className="p-4 rounded-2xl bg-[var(--bg-primary)] border-2 border-[var(--border)]">
                <div className="flex items-center justify-between mb-2">
                  <Icon className="w-4 h-4" style={{ color: s.color }} />
                </div>
                <p className="text-xl font-bold text-[var(--text-primary)]">{s.value}</p>
                <p className="text-xs text-[var(--text-secondary)]">{s.label}</p>
              </div>
            )
          })}
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2 bg-[var(--bg-primary)] rounded-2xl border-2 border-[var(--border)] p-6">
            <h2 className="font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-[var(--text-link)]" />
              Performance quotidienne
            </h2>
            {performance?.impressions?.length > 0 ? (
              <div className="space-y-2">
                <div className="flex items-center gap-6 text-xs text-[var(--text-secondary)] font-semibold pb-2 border-b border-[var(--border)]">
                  <span className="w-24">Date</span>
                  <span className="w-20 text-center">Impressions</span>
                  <span className="w-20 text-center">Clics</span>
                </div>
                {performance.impressions.map((imp: any) => {
                  const click = performance.clicks?.find((c: any) => c.date === imp.date)
                  return (
                    <div key={imp.date} className="flex items-center gap-6 text-sm text-[var(--text-primary)] py-1.5">
                      <span className="w-24 text-[var(--text-secondary)]">{new Date(imp.date).toLocaleDateString("fr-FR")}</span>
                      <span className="w-20 text-center font-semibold">{imp.count}</span>
                      <span className="w-20 text-center font-semibold">{click?.count || 0}</span>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-sm text-[var(--text-secondary)] text-center py-8">Aucune donnée de performance pour le moment</p>
            )}
          </div>

          <div className="space-y-4">
            <div className="bg-[var(--bg-primary)] rounded-2xl border-2 border-[var(--border)] p-6">
              <h2 className="font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                <Target className="w-4 h-4 text-[var(--text-link)]" />
                Informations
              </h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-[var(--text-secondary)]">Statut</span>
                  <span className="font-semibold text-[var(--text-primary)]">{STATUS_LABELS[campaign.status as CampaignStatus]}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-secondary)]">Budget</span>
                  <span className="font-semibold text-[var(--text-primary)]">{Number(campaign.budget || 0).toLocaleString("fr-FR")} F</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-secondary)]">Dépensé</span>
                  <span className="font-semibold text-[var(--text-primary)]">{Number(campaign.spent || 0).toLocaleString("fr-FR")} F</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-secondary)]">Score qualité</span>
                  <span className="font-semibold text-[var(--text-primary)]">{campaign.qualityScore?.toFixed(1) || "1.0"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-secondary)]">Jours restants</span>
                  <span className="font-semibold text-[var(--text-primary)]">{daysLeft}j</span>
                </div>
              </div>
            </div>

            <div className="bg-[var(--bg-primary)] rounded-2xl border-2 border-[var(--border)] p-6">
              <h2 className="font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[var(--text-link)]" />
                Ciblage
              </h2>
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2">
                  <Tag className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
                  <span className="text-[var(--text-secondary)]">Catégorie:</span>
                  <span className="font-semibold text-[var(--text-primary)]">{campaign.targetCategory || "Toutes"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
                  <span className="text-[var(--text-secondary)]">Pays:</span>
                  <span className="font-semibold text-[var(--text-primary)]">{campaign.targetCountry || "Tous"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
                  <span className="text-[var(--text-secondary)]">Ville:</span>
                  <span className="font-semibold text-[var(--text-primary)]">{campaign.targetCity || "Toutes"}</span>
                </div>
              </div>
            </div>

            {campaign.placements?.length > 0 && (
              <div className="bg-[var(--bg-primary)] rounded-2xl border-2 border-[var(--border)] p-6">
                <h2 className="font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                  <Megaphone className="w-4 h-4 text-[var(--text-link)]" />
                  Emplacements
                </h2>
                <div className="flex flex-wrap gap-2">
                  {campaign.placements.map((p: any) => (
                    <span key={p.id} className="px-3 py-1 rounded-full bg-[var(--bg-secondary)] text-xs text-[var(--text-primary)] font-semibold">
                      {AD_SLOT_LABELS[p.slot] || p.slot}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

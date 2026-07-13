"use client"

import { useState, useEffect } from "react"
import { DollarSign, ShoppingCart, Users, TrendingUp, Eye, ArrowUp, ArrowDown } from "lucide-react"
import { AnimatedDiv } from "@/lib/animations"

export default function DashboardPage() {
  const [stats, setStats] = useState<any>(null)
  const [sellerStats, setSellerStats] = useState<any>(null)
  const [period, setPeriod] = useState("30d")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/vendeur/services-pro/dashboard?period=${period}`).then(r => r.json())
      .then(d => { setStats(d.stats); setSellerStats(d.sellerStats); setLoading(false) })
      .catch(() => setLoading(false))
  }, [period])

  if (loading) return <div className="w-full min-h-screen bg-[var(--bg-secondary)] flex items-center justify-center"><p className="text-[var(--text-secondary)]">Chargement...</p></div>

  const cards = [
    { icon: DollarSign, label: "Chiffre d'affaires", value: `${stats?.revenue?.total?.toLocaleString("fr-FR") || 0} F`, change: stats?.revenue?.change, color: "#1769F2" },
    { icon: ShoppingCart, label: "Commandes", value: stats?.orders?.total || 0, change: stats?.orders?.change, color: "#10B981" },
    { icon: Users, label: "Visiteurs", value: stats?.visitors?.total || 0, change: stats?.visitors?.change, color: "#8B5CF6" },
    { icon: TrendingUp, label: "Taux conversion", value: `${stats?.conversionRate?.value || 0}%`, change: stats?.conversionRate?.change, color: "#F59E0B" },
  ]

  return (
    <div className="w-full min-h-screen bg-[var(--bg-secondary)] p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Tableau de bord professionnel</h1>
          <p className="text-sm text-[var(--text-secondary)]">Analyses détaillées de votre activité</p>
        </div>
        <div className="flex gap-2">
          {[
            { value: "7d", label: "7j" },
            { value: "30d", label: "30j" },
            { value: "90d", label: "90j" },
            { value: "1y", label: "1 an" },
          ].map(p => (
            <button key={p.value} onClick={() => setPeriod(p.value)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${period === p.value ? "bg-[var(--text-link)] text-white" : "bg-[var(--bg-primary)] text-[var(--text-secondary)] border border-[var(--border)]"}`}>{p.label}</button>
          ))}
        </div>
      </div>

      {sellerStats && (
        <div className="flex gap-4 mb-6 flex-wrap">
          <div className="px-4 py-2 rounded-xl bg-[var(--bg-primary)] border border-[var(--border)] text-sm">
            <span className="text-[var(--text-secondary)]">Produits: </span>
            <span className="text-[var(--text-primary)] font-semibold">{sellerStats.totalProducts}</span>
          </div>
          <div className="px-4 py-2 rounded-xl bg-[var(--bg-primary)] border border-[var(--border)] text-sm">
            <span className="text-[var(--text-secondary)]">En ligne: </span>
            <span className="text-[var(--text-primary)] font-semibold">{sellerStats.activeListings}</span>
          </div>
          <div className="px-4 py-2 rounded-xl bg-[var(--bg-primary)] border border-[var(--border)] text-sm">
            <span className="text-[var(--text-secondary)]">Note: </span>
            <span className="text-[var(--text-primary)] font-semibold">{sellerStats.averageRating}/5</span>
          </div>
          {sellerStats.verifiedBadge && (
            <div className="px-4 py-2 rounded-xl bg-green-500/10 border border-green-500/20 text-sm">
              <span className="text-green-400 font-semibold">✅ Vendeur Vérifié</span>
            </div>
          )}
        </div>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {cards.map((c, i) => {
          const Icon = c.icon
          const isUp = (c.change || 0) >= 0
          return (
            <AnimatedDiv key={c.label} fade slideUp delay={i * 0.05} className="p-5 rounded-2xl bg-[var(--bg-primary)] border-2 border-[var(--border)]">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${c.color}15` }}>
                  <Icon className="w-5 h-5" style={{ color: c.color }} />
                </div>
                {c.change !== undefined && (
                  <div className={`flex items-center gap-1 text-xs font-semibold ${isUp ? "text-green-400" : "text-red-400"}`}>
                    {isUp ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                    {Math.abs(c.change)}%
                  </div>
                )}
              </div>
              <p className="text-2xl font-bold text-[var(--text-primary)]">{c.value}</p>
              <p className="text-xs text-[var(--text-secondary)]">{c.label}</p>
            </AnimatedDiv>
          )
        })}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <AnimatedDiv fade slideUp className="bg-[var(--bg-primary)] rounded-2xl border-2 border-[var(--border)] p-5">
          <h2 className="font-bold text-[var(--text-primary)] mb-4">Produits les plus consultés</h2>
          <div className="space-y-2">
            {(stats?.topProducts || []).slice(0, 5).map((p: any, i: number) => (
              <div key={p.id} className="flex items-center justify-between p-3 rounded-xl bg-[var(--bg-secondary)]">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-[var(--text-secondary)] w-5">{i + 1}</span>
                  <p className="text-sm font-medium text-[var(--text-primary)] truncate max-w-[200px]">{p.name}</p>
                </div>
                <div className="flex gap-4 text-xs text-[var(--text-secondary)]">
                  <span>{p.views} vues</span>
                  <span>{p.sales} ventes</span>
                </div>
              </div>
            ))}
            {(!stats?.topProducts || stats.topProducts.length === 0) && (
              <p className="text-sm text-[var(--text-secondary)] text-center py-4">Aucune donnée</p>
            )}
          </div>
        </AnimatedDiv>

        <AnimatedDiv fade slideUp delay={0.05} className="bg-[var(--bg-primary)] rounded-2xl border-2 border-[var(--border)] p-5">
          <h2 className="font-bold text-[var(--text-primary)] mb-4">Produits les plus vendus</h2>
          <div className="space-y-2">
            {(stats?.topSelling || []).slice(0, 5).map((p: any, i: number) => (
              <div key={p.id} className="flex items-center justify-between p-3 rounded-xl bg-[var(--bg-secondary)]">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-[var(--text-secondary)] w-5">{i + 1}</span>
                  <p className="text-sm font-medium text-[var(--text-primary)] truncate max-w-[200px]">{p.name}</p>
                </div>
                <div className="flex gap-4 text-xs text-[var(--text-secondary)]">
                  <span>{p.quantity} vendus</span>
                  <span>{Number(p.revenue).toLocaleString("fr-FR")} F</span>
                </div>
              </div>
            ))}
            {(!stats?.topSelling || stats.topSelling.length === 0) && (
              <p className="text-sm text-[var(--text-secondary)] text-center py-4">Aucune donnée</p>
            )}
          </div>
        </AnimatedDiv>
      </div>

      {(stats?.revenueByPeriod && stats.revenueByPeriod.length > 0) && (
        <AnimatedDiv fade slideUp className="mt-6 bg-[var(--bg-primary)] rounded-2xl border-2 border-[var(--border)] p-5">
          <h2 className="font-bold text-[var(--text-primary)] mb-4">Revenus par période</h2>
          <div className="grid grid-cols-7 gap-2">
            {stats.revenueByPeriod.map((r: any) => (
              <div key={r.period} className="flex flex-col items-center p-2 rounded-lg bg-[var(--bg-secondary)]">
                <span className="text-[10px] text-[var(--text-secondary)]">{new Date(r.period).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" })}</span>
                <span className="text-xs font-semibold text-[var(--text-primary)] mt-1">{Number(r.amount).toLocaleString("fr-FR")} F</span>
              </div>
            ))}
          </div>
        </AnimatedDiv>
      )}
    </div>
  )
}

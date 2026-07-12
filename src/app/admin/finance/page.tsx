"use client"

import { useEffect, useState } from "react"
import { DollarSign, TrendingUp, ArrowLeft, CreditCard, ShoppingBag } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"

interface FinanceStats {
  totalRevenue: number
  totalOrders: number
  totalProducts: number
  totalSellers: number
}

export default function AdminFinancePage() {
  const { getAuthHeaders } = useAuth()
  const [stats, setStats] = useState<FinanceStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/admin/stats", { headers: getAuthHeaders() })
      .then((r) => r.json())
      .then((data) => setStats(data.stats))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [getAuthHeaders])

  if (loading) return <div className="flex items-center justify-center h-64"><p className="text-[var(--text-secondary)]">Chargement...</p></div>

  const cards = [
    {
      icon: DollarSign,
      label: "Revenus totaux",
      value: stats ? `${stats.totalRevenue.toLocaleString("fr-FR")} F` : "-",
      sub: "depuis le lancement",
      color: "#1769F2",
    },
    {
      icon: TrendingUp,
      label: "Commandes",
      value: stats ? stats.totalOrders.toLocaleString("fr-FR") : "-",
      sub: "commandes validées",
      color: "#059669",
    },
    {
      icon: ShoppingBag,
      label: "Produits vendus",
      value: stats ? stats.totalProducts.toString() : "-",
      sub: "références actives",
      color: "#D97706",
    },
    {
      icon: CreditCard,
      label: "Commission moyenne",
      value: "12%",
      sub: "prélèvement par vente",
      color: "#0B4FC8",
    },
  ]

  return (
    <div className="p-4 lg:p-8 space-y-8">
      <div className="flex items-center gap-4">
        <Link href="/admin" className="p-2 rounded-xl bg-[var(--bg-card)] border border-[var(--border)] hover:border-[var(--border-hover)]/30 transition-colors">
          <ArrowLeft className="w-5 h-5 text-[var(--text-muted)]" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">Finance</h1>
          <p className="text-[var(--text-secondary)] text-sm">Aperçu financier de la plateforme</p>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => {
          const Icon = c.icon
          return (
            <div key={c.label} className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border)] hover:border-[var(--border-hover)]/30 transition-all">
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${c.color}15` }}>
                  <Icon className="w-5 h-5" style={{ color: c.color }} />
                </div>
              </div>
              <p className="text-2xl font-bold text-white">{c.value}</p>
              <p className="text-xs text-[var(--text-secondary)]">{c.label}</p>
              <p className="text-[10px] text-[var(--text-muted)] mt-0.5">{c.sub}</p>
            </div>
          )
        })}
      </div>

      <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] p-6">
        <h3 className="font-bold text-white text-sm mb-4 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-[var(--text-link)]" /> Évolution des revenus
        </h3>
        <div className="h-48 flex items-center justify-center">
          <p className="text-[var(--text-secondary)] text-sm">Graphique disponible prochainement</p>
        </div>
      </div>
    </div>
  )
}

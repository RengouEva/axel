"use client"

import { useEffect, useState } from "react"
import { Users, ShoppingCart, DollarSign, Package, CreditCard, Mail, TrendingUp, Clock, Store } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { LoadingSpinner } from "@/components/ui/loading-spinner"

interface AdminStats {
  totalUsers: number; totalClients: number; totalSellers: number; totalAdmins: number
  totalOrders: number; totalProducts: number; totalShops: number; totalRevenue: number; unreadMessages: number
}

export default function AdminDashboard() {
  const { getAuthHeaders } = useAuth()
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [recentOrders, setRecentOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    fetch("/api/admin/stats", { headers: getAuthHeaders() })
      .then(r => r.json())
      .then(d => { if (!cancelled) { setStats(d.stats); setRecentOrders(d.recentOrders || []) } })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [getAuthHeaders])

  if (loading || !stats) return <div className="flex items-center justify-center h-64"><LoadingSpinner size="lg" /></div>

  const cards = [
    { icon: Users, label: "Utilisateurs", value: stats.totalUsers.toString(), sub: `${stats.totalClients} clients | ${stats.totalSellers} vendeurs`, color: "#1769F2", href: "/admin/utilisateurs" },
    { icon: Store, label: "Boutiques", value: stats.totalShops.toString(), sub: `${stats.totalSellers} vendeurs`, color: "#059669", href: "/admin/boutiques" },
    { icon: Package, label: "Produits", value: stats.totalProducts.toString(), sub: "références", color: "#0B4FC8", href: "/admin/produits" },
    { icon: ShoppingCart, label: "Commandes", value: stats.totalOrders.toString(), sub: `${recentOrders.filter(o => o.status === "pending").length} en attente`, color: "#D97706", href: "/admin/commandes" },
    { icon: DollarSign, label: "Revenus", value: `${(stats.totalRevenue / 1000).toFixed(1)}K F`, sub: "total généré", color: "#061A4A", href: "/admin/finance" },
    { icon: CreditCard, label: "Crédits", value: "-", sub: "en développement", color: "#1769F2", href: "/admin/credits" },
    { icon: Mail, label: "Messages", value: stats.unreadMessages.toString(), sub: "non lus", color: "#059669", href: "/contact" },
    { icon: TrendingUp, label: "Croissance", value: "+12.5%", sub: "ce mois", color: "#D97706", href: "/admin/stats" },
  ]

  return (
    <div className="p-4 lg:p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-[var(--text-secondary)] text-sm">Vue d'ensemble de la plateforme AXEL</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => {
          const Icon = c.icon
          return (
            <Link key={c.label} href={c.href} className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border)] hover:border-[var(--border-hover)]/30 transition-all group">
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${c.color}15` }}>
                  <Icon className="w-5 h-5" style={{ color: c.color }} />
                </div>
                <span className="text-[10px] text-[var(--text-link)] opacity-0 group-hover:opacity-100 transition-opacity">Voir {">"}</span>
              </div>
              <p className="text-2xl font-bold text-white">{c.value}</p>
              <p className="text-xs text-[var(--text-secondary)]">{c.label}</p>
              {c.sub && <p className="text-[10px] text-[var(--text-muted)] mt-0.5">{c.sub}</p>}
            </Link>
          )
        })}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] p-5">
          <h3 className="font-bold text-white text-sm mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-[var(--text-link)]" /> Dernières commandes
          </h3>
          <div className="space-y-2">
            {recentOrders.length === 0 ? (
              <p className="text-xs text-[var(--text-secondary)] text-center py-4">Aucune commande</p>
            ) : recentOrders.slice(0, 5).map((o) => (
              <div key={o.id} className="flex items-center justify-between p-3 rounded-xl bg-[var(--bg-primary)]">
                <div>
                  <p className="text-sm font-semibold text-white">{o.user?.name || "-"}</p>
                  <p className="text-[10px] text-[var(--text-secondary)]">{o.id} | {new Date(o.date).toLocaleDateString("fr-FR")}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-white">{o.total.toLocaleString("fr-FR")} F</p>
                  <span className={`text-[10px] font-semibold ${o.status === "delivered" ? "text-green-500" : o.status === "pending" ? "text-amber-500" : "text-blue-500"}`}>{o.status}</span>
                </div>
              </div>
            ))}
          </div>
          <Link href="/admin/commandes" className="block text-center text-xs font-semibold text-[var(--text-link)] mt-4 hover:underline">{"Voir toutes les commandes >"}</Link>
        </div>

        <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] p-5">
          <h3 className="font-bold text-white text-sm mb-4 flex items-center gap-2">
            <Users className="w-4 h-4 text-[var(--text-link)]" /> Répartition des utilisateurs
          </h3>
          <div className="space-y-3">
              {[
                { label: "Clients", value: stats.totalClients, color: "#1769F2", pct: stats.totalUsers ? Math.round(stats.totalClients / stats.totalUsers * 100) : 0 },
                { label: "Vendeurs", value: stats.totalSellers, color: "#059669", pct: stats.totalUsers ? Math.round(stats.totalSellers / stats.totalUsers * 100) : 0 },
                { label: "Administrateurs", value: stats.totalAdmins, color: "#D97706", pct: stats.totalUsers ? Math.round(stats.totalAdmins / stats.totalUsers * 100) : 0 },
              ].map((item) => (
              <div key={item.label}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-[var(--text-muted)]">{item.label}</span>
                  <span className="text-white font-semibold">{item.value}</span>
                </div>
                <div className="h-2 rounded-full bg-[var(--bg-primary)] overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-500" style={{ width: `${item.pct}%`, backgroundColor: item.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}



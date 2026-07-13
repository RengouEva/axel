"use client"

import { useEffect, useState } from "react"
import {
  Users, Store, Package, ShoppingCart, DollarSign,
  Clock, Eye, Activity, BarChart3
} from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { LoadingSpinner } from "@/components/ui/loading-spinner"

interface AdminStats {
  totalUsers: number; totalClients: number; totalSellers: number; totalAdmins: number
  totalOrders: number; totalProducts: number; totalShops: number; totalRevenue: number; unreadMessages: number
}

interface Order {
  id: string; total: number; status: string; date: string
  user?: { id: number; name: string; email: string } | null
}

const statusStyles: Record<string, string> = {
  pending: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  processing: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  shipped: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  delivered: "bg-green-500/10 text-green-400 border-green-500/20",
  cancelled: "bg-red-500/10 text-red-400 border-red-500/20",
}
const statusLabels: Record<string, string> = {
  pending: "En attente", processing: "En cours", shipped: "Expédiée", delivered: "Livrée", cancelled: "Annulée",
}

function StatCard({ icon: Icon, label, value, sub, href }: { icon: any; label: string; value: string; sub: string; href: string }) {
  return (
    <Link href={href} className="group relative p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border)] hover:border-[var(--border-hover)]/30 transition-all duration-300 overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--text-link)]/5 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:bg-[var(--text-link)]/10 transition-colors" />
      <div className="relative">
        <div className="w-10 h-10 rounded-xl bg-[var(--text-link)]/10 flex items-center justify-center mb-4">
          <Icon className="w-5 h-5 text-[var(--text-info)]" />
        </div>
        <p className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">{value}</p>
        <p className="text-xs text-[var(--text-secondary)] mt-0.5">{label}</p>
        <p className="text-[10px] text-[var(--text-muted)] mt-0.5">{sub}</p>
      </div>
    </Link>
  )
}

export default function AdminDashboard() {
  const { user, getAuthHeaders } = useAuth()
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    fetch("/api/admin/stats", { headers: getAuthHeaders() })
      .then(r => r.json())
      .then(d => { if (!cancelled) { setStats(d.stats); setOrders(d.recentOrders || []) } })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [getAuthHeaders])

  if (loading || !stats) {
    return <div className="flex items-center justify-center min-h-[60vh]"><LoadingSpinner size="lg" text="Chargement du tableau de bord..." /></div>
  }

  const cards = [
    { icon: DollarSign, label: "Revenus", value: `${(stats.totalRevenue / 1000).toFixed(1)}K F`, sub: "total généré", href: "/admin/finance" },
    { icon: ShoppingCart, label: "Commandes", value: stats.totalOrders.toString(), sub: `${orders.filter(o => o.status === "pending").length} en attente`, href: "/admin/commandes" },
    { icon: Store, label: "Boutiques", value: stats.totalShops.toString(), sub: `${stats.totalSellers} vendeurs`, href: "/admin/boutiques" },
    { icon: Package, label: "Produits", value: stats.totalProducts.toString(), sub: "références actives", href: "/admin/produits" },
  ]

  return (
    <div className="p-4 lg:p-8 space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">Bon retour, {user?.name?.split(" ")[0] || "Admin"}</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">Voici le résumé de votre plateforme AXEL</p>
        </div>
        <div className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] text-xs text-[var(--text-secondary)]">
          <Clock className="w-3.5 h-3.5" />
          {new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map(c => <StatCard key={c.label} {...c} />)}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-2xl bg-[var(--bg-card)] border border-[var(--border)] p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2"><ShoppingCart className="w-4 h-4 text-[var(--text-info)]" /> Dernières commandes</h3>
            <Link href="/admin/commandes" className="text-xs text-[var(--text-info)] hover:text-[var(--text-primary)] transition-colors font-medium">Voir tout</Link>
          </div>
          {orders.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)] text-center py-8">Aucune commande récente</p>
          ) : (
            <div className="space-y-2">
              {orders.slice(0, 6).map((o) => (
                <div key={o.id} className="flex items-center justify-between p-3 rounded-xl bg-[var(--bg-elevated)] hover:bg-[var(--bg-hover)] transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-[var(--text-link)]/10 flex items-center justify-center shrink-0">
                      <ShoppingCart className="w-4 h-4 text-[var(--text-info)]" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[var(--text-primary)] truncate">{o.user?.name || "Client"}</p>
                      <p className="text-[10px] text-[var(--text-secondary)]">{o.date ? new Date(o.date).toLocaleDateString("fr-FR", { day: "numeric", month: "short" }) : "-"} · <span className="font-mono">{o.id?.toString().slice(-8) || "-"}</span></p>
                    </div>
                  </div>
                  <div className="text-right flex items-center gap-3">
                    <p className="text-sm font-bold text-[var(--text-primary)]">{o.total?.toLocaleString("fr-FR") || "0"} F</p>
                    <span className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold border ${statusStyles[o.status] || "bg-[var(--bg-elevated)] text-[var(--text-secondary)] border-[var(--border)]"}`}>{statusLabels[o.status] || o.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl bg-[var(--bg-card)] border border-[var(--border)] p-6">
            <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2 mb-5"><Users className="w-4 h-4 text-[var(--text-info)]" /> Utilisateurs</h3>
            <div className="space-y-4">
              {[
                { label: "Clients", value: stats.totalClients, color: "#1769F2", pct: stats.totalUsers ? Math.round(stats.totalClients / stats.totalUsers * 100) : 0 },
                { label: "Vendeurs", value: stats.totalSellers, color: "#059669", pct: stats.totalUsers ? Math.round(stats.totalSellers / stats.totalUsers * 100) : 0 },
                { label: "Administrateurs", value: stats.totalAdmins, color: "#D97706", pct: stats.totalUsers ? Math.round(stats.totalAdmins / stats.totalUsers * 100) : 0 },
              ].map((item) => (
                <div key={item.label}>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-[var(--text-secondary)]">{item.label}</span>
                  <span className="text-[var(--text-primary)] font-semibold">{item.value}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-[var(--bg-elevated)] overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-700 ease-out" style={{ width: `${item.pct}%`, backgroundColor: item.color }} />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-[var(--border)] flex items-center justify-between text-xs">
              <span className="text-[var(--text-secondary)]">Total</span>
              <span className="text-[var(--text-primary)] font-bold">{stats.totalUsers}</span>
            </div>
          </div>

          <div className="rounded-2xl bg-[var(--bg-card)] border border-[var(--border)] p-6">
            <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2 mb-4"><Activity className="w-4 h-4 text-[var(--text-info)]" /> Accès rapide</h3>
            <div className="grid grid-cols-2 gap-2">
              {[
                { icon: BarChart3, label: "Statistiques", href: "/admin/stats", desc: "Voir les données" },
                { icon: Users, label: "Utilisateurs", href: "/admin/utilisateurs", desc: `${stats.totalUsers} inscrits` },
                { icon: Store, label: "Boutiques", href: "/admin/boutiques", desc: `${stats.totalShops} boutiques` },
                { icon: Eye, label: "Site", href: "/", desc: "Voir le marketplace" },
              ].map((a) => {
                const Icon = a.icon
                return (
                  <Link key={a.label} href={a.href} className="flex flex-col items-center gap-2 p-4 rounded-xl bg-[var(--bg-elevated)] hover:bg-[var(--text-link)]/10 border border-transparent hover:border-[var(--border-hover)]/20 transition-all group text-center">
                    <Icon className="w-5 h-5 text-[var(--text-secondary)] group-hover:text-[var(--text-info)] transition-colors" />
                    <span className="text-xs font-semibold text-[var(--text-primary)]">{a.label}</span>
                    <span className="text-[10px] text-[var(--text-muted)]">{a.desc}</span>
                  </Link>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

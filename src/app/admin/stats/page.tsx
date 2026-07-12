"use client"

import { useEffect, useState, useCallback } from "react"
import { TrendingUp, BarChart3, Activity, RefreshCw, Users, ShoppingCart, DollarSign, Package } from "lucide-react"
import { useAuth } from "@/lib/auth-context"

interface AdminStats {
  totalUsers: number
  totalClients: number
  totalSellers: number
  totalAdmins: number
  totalOrders: number
  totalProducts: number
  totalShops: number
  totalRevenue: number
  unreadMessages: number
}

interface Order {
  id: string
  status: string
  total: number
  date: string
}

export default function AdminStatsPage() {
  const { getAuthHeaders } = useAuth()
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [recentOrders, setRecentOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setError(null)
      const r = await fetch("/api/admin/stats", { headers: getAuthHeaders() })
      if (!r.ok) {
        const data = await r.json()
        throw new Error(data.error || "Erreur lors du chargement")
      }
      const data = await r.json()
      setStats(data.stats)
      setRecentOrders(data.recentOrders || [])
    } catch (err) {
      console.error("[ADMIN_STATS_FETCH]", err)
      setError(err instanceof Error ? err.message : "Erreur lors du chargement des statistiques")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [getAuthHeaders])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleRefresh = () => {
    setRefreshing(true)
    fetchData()
  }

  if (loading) return <div className="flex items-center justify-center h-64"><p className="text-[var(--text-secondary)]">Chargement...</p></div>

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-red-500">{error}</p>
        <button
          onClick={handleRefresh}
          className="px-4 py-2 rounded-xl bg-[var(--text-link)] text-white text-sm font-semibold hover:bg-[#0B4FC8] transition-colors"
        >
          Réessayer
        </button>
      </div>
    )
  }

  if (!stats) return null

  const userDistribution = [
    { label: "Clients", value: stats.totalClients, color: "#1769F2" },
    { label: "Vendeurs", value: stats.totalSellers, color: "#059669" },
    { label: "Admins", value: stats.totalAdmins, color: "#D97706" },
  ]
  const maxUserVal = Math.max(...userDistribution.map((u) => u.value), 1)

  const orderStatuses = ["pending", "processing", "shipped", "delivered"]
  const statusLabels: Record<string, string> = {
    pending: "En attente", processing: "En cours", shipped: "Expédié", delivered: "Livré",
  }
  const statusColors: Record<string, string> = {
    pending: "#F59E0B", processing: "#3B82F6", shipped: "#8B5CF6", delivered: "#10B981",
  }
  const statusCounts = orderStatuses.map((s) => ({
    label: statusLabels[s],
    value: recentOrders.filter((o) => o.status === s).length,
    color: statusColors[s],
  }))
  const maxStatusVal = Math.max(...statusCounts.map((s) => s.value), 1)

  const summaryCards = [
    { icon: TrendingUp, label: "Revenus", value: `${(stats.totalRevenue / 1000).toFixed(1)}K F`, color: "#1769F2" },
    { icon: Users, label: "Utilisateurs", value: stats.totalUsers.toString(), color: "#059669" },
    { icon: ShoppingCart, label: "Commandes", value: stats.totalOrders.toString(), color: "#D97706" },
    { icon: Package, label: "Produits", value: stats.totalProducts.toString(), color: "#0B4FC8" },
  ]

  return (
    <div className="p-4 lg:p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Statistiques</h1>
          <p className="text-[var(--text-secondary)] text-sm">Indicateurs clés en temps réel</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--text-link)] text-white text-sm font-semibold hover:bg-[#0B4FC8] transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
          {refreshing ? "Actualisation..." : "Actualiser"}
        </button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map((c) => {
          const Icon = c.icon
          return (
            <div key={c.label} className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border)]">
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${c.color}15` }}>
                  <Icon className="w-5 h-5" style={{ color: c.color }} />
                </div>
              </div>
              <p className="text-2xl font-bold text-white">{c.value}</p>
              <p className="text-xs text-[var(--text-secondary)]">{c.label}</p>
            </div>
          )
        })}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] p-6">
          <h3 className="font-bold text-white text-sm mb-6 flex items-center gap-2">
            <Users className="w-4 h-4 text-[var(--text-link)]" /> Répartition des utilisateurs
          </h3>
          <div className="space-y-4">
            {userDistribution.map((item) => (
              <div key={item.label}>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="text-[var(--text-muted)]">{item.label}</span>
                  <span className="text-white font-semibold">{item.value}</span>
                </div>
                <div className="h-3 rounded-full bg-[var(--bg-primary)] overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${(item.value / maxUserVal) * 100}%`, backgroundColor: item.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] p-6">
          <h3 className="font-bold text-white text-sm mb-6 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-[var(--text-link)]" /> Commandes par statut
          </h3>
          <div className="space-y-4">
            {statusCounts.map((item) => (
              <div key={item.label}>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="text-[var(--text-muted)]">{item.label}</span>
                  <span className="text-white font-semibold">{item.value}</span>
                </div>
                <div className="h-3 rounded-full bg-[var(--bg-primary)] overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${(item.value / maxStatusVal) * 100}%`, backgroundColor: item.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] p-6 lg:col-span-2">
          <h3 className="font-bold text-white text-sm mb-6 flex items-center gap-2">
            <Activity className="w-4 h-4 text-[var(--text-link)]" /> Aperçu des activités
          </h3>
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-[var(--bg-primary)] border border-[var(--border)]">
              <p className="text-2xl font-bold text-white">{stats.totalShops}</p>
              <p className="text-xs text-[var(--text-secondary)]">Boutiques actives</p>
            </div>
            <div className="p-4 rounded-xl bg-[var(--bg-primary)] border border-[var(--border)]">
              <p className="text-2xl font-bold text-white">{stats.unreadMessages}</p>
              <p className="text-xs text-[var(--text-secondary)]">Messages non lus</p>
            </div>
            <div className="p-4 rounded-xl bg-[var(--bg-primary)] border border-[var(--border)]">
              <p className="text-2xl font-bold text-white">{stats.totalClients + stats.totalSellers}</p>
              <p className="text-xs text-[var(--text-secondary)]">Utilisateurs actifs</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

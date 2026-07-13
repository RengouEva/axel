"use client"

import { useEffect, useState } from "react"
import { ShoppingCart, ArrowLeft, Shield, Package, Search } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import Link from "next/link"

interface OrderItem {
  id: number
  name: string
  quantity: number
  price: number
}

interface Order {
  id: string
  date: string
  status: string
  total: number
  items: OrderItem[]
  user?: { id: number; name: string; email: string }
}

export default function AdminOrdersPage() {
  const { user, getAuthHeaders } = useAuth()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")

  useEffect(() => {
    fetch("/api/orders", { headers: getAuthHeaders() })
      .then((r) => r.json())
      .then((data) => setOrders(data.orders || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [getAuthHeaders])

  if (!user || user.role !== "admin") {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Shield className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-4" />
          <p className="text-[var(--text-secondary)]">Accès restreint</p>
        </div>
      </div>
    )
  }

  const statusLabels: Record<string, string> = {
    pending: "En attente", processing: "En cours", shipped: "Expédiée", delivered: "Livrée", cancelled: "Annulée",
  }
  const statusColors: Record<string, string> = {
    pending: "text-amber-400 bg-amber-500/10", processing: "text-blue-400 bg-blue-500/10",
    shipped: "text-purple-400 bg-purple-500/10", delivered: "text-green-400 bg-green-500/10",
    cancelled: "text-red-400 bg-red-500/10",
  }

  const filtered = orders.filter(o =>
    !search || o.id.toLowerCase().includes(search.toLowerCase()) || o.user?.name?.toLowerCase().includes(search.toLowerCase())
  )

  const totalRevenue = orders.reduce((s, o) => s + o.total, 0)

  return (
    <div className="p-4 lg:p-8 space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin" className="p-2 rounded-xl bg-[var(--bg-card)] border border-[var(--border)] hover:border-[var(--border-hover)]/30 transition-colors">
          <ArrowLeft className="w-5 h-5 text-[var(--text-secondary)]" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Commandes</h1>
          <p className="text-sm text-[var(--text-secondary)]">{orders.length} commandes · {totalRevenue.toLocaleString("fr-FR")} F de revenus</p>
        </div>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
        <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher une commande..."
          className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-card)] pl-10 pr-4 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--border-hover)]/30 transition-colors" />
      </div>

      {loading ? (
        <p className="text-center text-[var(--text-secondary)] py-12">Chargement...</p>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 bg-[var(--bg-card)] rounded-2xl border border-[var(--border)]">
          <ShoppingCart className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-4" />
          <p className="text-[var(--text-secondary)]">Aucune commande trouvée</p>
        </div>
      ) : (
        <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] overflow-hidden">
          <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-[var(--bg-elevated)] border-b border-[var(--border)] text-xs font-semibold text-[var(--text-muted)]">
            <div className="col-span-3">Client</div>
            <div className="col-span-3">Commande</div>
            <div className="col-span-2">Total</div>
            <div className="col-span-2">Statut</div>
            <div className="col-span-2">Date</div>
          </div>
          {filtered.map((o) => (
            <div key={o.id} className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-[var(--border)] last:border-0 items-center hover:bg-[var(--bg-elevated)] transition-colors">
              <div className="col-span-3 flex items-center gap-2">
                <Package className="w-4 h-4 text-[var(--text-info)]" />
                <span className="text-sm font-semibold text-[var(--text-primary)]">{o.user?.name || "-"}</span>
              </div>
              <div className="col-span-3 text-sm text-[var(--text-secondary)] font-mono">#{o.id?.toString().slice(-8)}</div>
              <div className="col-span-2 text-sm font-bold text-[var(--text-primary)]">{o.total.toLocaleString("fr-FR")} F</div>
              <div className="col-span-2">
                <span className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold ${statusColors[o.status] || "text-[var(--text-secondary)] bg-[var(--bg-elevated)]"}`}>
                  {statusLabels[o.status] || o.status}
                </span>
              </div>
              <div className="col-span-2 text-xs text-[var(--text-secondary)]">{new Date(o.date).toLocaleDateString("fr-FR")}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

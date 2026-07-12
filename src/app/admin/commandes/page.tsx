"use client"

import { useEffect, useState } from "react"
import { ShoppingCart, ArrowLeft, Shield, Package } from "lucide-react"
import { AnimatedDiv } from "@/lib/animations"
import { useAuth } from "@/lib/auth-context"
import Button from "@/components/ui/button"
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

  useEffect(() => {
    fetch("/api/orders", { headers: getAuthHeaders() })
      .then((r) => r.json())
      .then((data) => setOrders(data.orders || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [getAuthHeaders])

  if (!user || user.role !== "admin") {
    return (
      <div className="w-full min-h-screen bg-[var(--bg-secondary)] flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-16 h-16 text-[var(--text-muted)] mx-auto mb-4" />
          <p className="text-[var(--text-secondary)]">Accès restreint</p>
          <Link href="/compte"><Button>Retour</Button></Link>
        </div>
      </div>
    )
  }

  const statusLabels: Record<string, string> = {
    pending: "En attente", processing: "En cours", shipped: "Expédié", delivered: "Livré",
  }
  const statusColors: Record<string, string> = {
    pending: "text-amber-600 bg-amber-50", processing: "text-blue-600 bg-blue-50",
    shipped: "text-purple-600 bg-purple-50", delivered: "text-green-600 bg-green-50",
  }

  const totalRevenue = orders.reduce((s, o) => s + o.total, 0)

  return (
    <div className="w-full min-h-screen bg-[var(--bg-secondary)]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/admin" className="p-2 rounded-xl bg-[var(--bg-primary)] hover:bg-[var(--bg-secondary)] transition-colors"><ArrowLeft className="w-5 h-5 text-[var(--text-secondary)]" /></Link>
          <div>
            <h1 className="text-4xl font-bold text-[var(--text-primary)]">Commandes</h1>
            <p className="text-[var(--text-secondary)]">{orders.length} commandes | {totalRevenue.toLocaleString("fr-FR")} F de revenus</p>
          </div>
        </div>

        {loading ? (
          <p className="text-center text-[var(--text-secondary)] py-12">Chargement...</p>
        ) : orders.length === 0 ? (
          <div className="text-center py-12">
            <ShoppingCart className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-4" />
            <p className="text-[var(--text-secondary)]">Aucune commande</p>
          </div>
        ) : (
          <div className="bg-[var(--bg-primary)] rounded-2xl border-2 border-[var(--border)] overflow-hidden">
            <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-[var(--bg-secondary)] border-b border-[var(--border)] text-xs font-semibold text-[var(--text-secondary)]">
              <div className="col-span-3">Client</div>
              <div className="col-span-3">Commande</div>
              <div className="col-span-2">Total</div>
              <div className="col-span-2">Statut</div>
              <div className="col-span-2">Date</div>
            </div>
            {orders.map((o, i) => (
              <AnimatedDiv key={o.id} fade slideUp delay={i * 0.02} className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-[var(--border)] last:border-0 items-center hover:bg-[var(--bg-secondary)]/50 transition-colors">
                <div className="col-span-3 flex items-center gap-2">
                  <Package className="w-4 h-4 text-[var(--text-link)]" />
                  <span className="text-sm font-semibold text-[var(--text-primary)]">{o.user?.name || "-"}</span>
                </div>
                <div className="col-span-3 text-sm text-[var(--text-secondary)]">{o.id}</div>
                <div className="col-span-2 text-sm font-bold text-[var(--text-primary)]">{o.total.toLocaleString("fr-FR")} F</div>
                <div className="col-span-2">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${statusColors[o.status] || "text-gray-600 bg-gray-50"}`}>
                    {statusLabels[o.status] || o.status}
                  </span>
                </div>
                <div className="col-span-2 text-xs text-[var(--text-secondary)]">{new Date(o.date).toLocaleDateString("fr-FR")}</div>
              </AnimatedDiv>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

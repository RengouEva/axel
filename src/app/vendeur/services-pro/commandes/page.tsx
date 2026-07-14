"use client"

import { useState, useEffect } from "react"
import { ShoppingCart, FileText, RotateCcw, Search, Loader2, Package } from "lucide-react"
import Button from "@/components/ui/button"
import toast from "react-hot-toast"
import { useAuth } from "@/lib/auth-context"
import type { ReturnRequest } from "@/lib/services-pro-types"

interface Order {
  id: string
  customerName: string
  createdAt: string
  status: string
  total: number
}

interface OrdersResponse {
  orders: Order[]
}

interface ReturnsResponse {
  returns: ReturnRequest[]
}

const statusLabels: Record<string, string> = {
  pending: "En attente", processing: "En cours", shipped: "Expédié",
  delivered: "Livré", cancelled: "Annulé",
}

function EmptyState({ icon: Icon, title, description }: { icon: any; title: string; description: string }) {
  return (
    <div className="text-center py-12">
      <Icon className="w-12 h-12 mx-auto mb-4 text-[var(--text-muted)]" />
      <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-1">{title}</h3>
      <p className="text-sm text-[var(--text-secondary)]">{description}</p>
    </div>
  )
}

export default function OrdersPage() {
  const { getAuthHeaders } = useAuth()
  const [orders, setOrders] = useState<Order[]>([])
  const [returns, setReturns] = useState<ReturnRequest[]>([])
  const [tab, setTab] = useState("orders")
  const [loading, setLoading] = useState(true)
  const [orderSearch, setOrderSearch] = useState("")

  useEffect(() => {
    Promise.all([
      fetch("/api/vendeur/services-pro/orders/returns", { headers: getAuthHeaders() }).then(async r => { if (!r.ok) { const err = await r.json(); toast.error(err.error || "Une erreur est survenue"); return {} }; return r.json() }),
      fetch("/api/vendeur/services-pro/orders", { headers: getAuthHeaders() }).then(async r => { if (!r.ok) { const err = await r.json(); toast.error(err.error || "Une erreur est survenue"); return {} }; return r.json() }),
    ]).then(([retData, ordData]) => {
      setReturns(retData.returns || [])
      setOrders(ordData.orders || [])
      setLoading(false)
    }).catch(() => { toast.error("Une erreur est survenue"); setLoading(false) })
  }, [])

  const handleReturnAction = async (id: string, status: ReturnRequest["status"], refundAmount?: number) => {
    try {
      const res = await fetch("/api/vendeur/services-pro/orders/returns", {
        method: "PUT", headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({ requestId: id, status, refundAmount: refundAmount || 0 }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error); return }
      toast.success("Retour mis à jour")
    } catch { toast.error("Erreur") }
  }

  const handleInvoice = async (orderId: string) => {
    const res = await fetch(`/api/vendeur/services-pro/orders/invoices?orderId=${orderId}`, { headers: getAuthHeaders() })
    const data = await res.json()
    if (data.invoice) {
      toast.success("Facture générée")
    }
  }

  if (loading) return <div className="w-full min-h-screen bg-[var(--bg-secondary)] flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin" style={{ color: "var(--text-link)" }} /></div>

  return (
    <div className="w-full min-h-screen bg-[var(--bg-secondary)] p-6">
      <div className="flex items-center gap-3 mb-6">
        <ShoppingCart className="w-8 h-8 text-[var(--text-link)]" />
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Gestion des commandes</h1>
          <p className="text-sm text-[var(--text-secondary)]">Suivi, factures, retours et remboursements</p>
        </div>
      </div>

      <div className="flex gap-2 mb-6">
        <button onClick={() => setTab("orders")} className={`px-4 py-2 rounded-xl text-sm font-medium ${tab === "orders" ? "bg-[var(--text-link)] text-white" : "bg-[var(--bg-primary)] text-[var(--text-secondary)] border border-[var(--border)]"}`}>
          <FileText className="w-4 h-4 inline mr-1" /> Commandes
        </button>
        <button onClick={() => setTab("returns")} className={`px-4 py-2 rounded-xl text-sm font-medium ${tab === "returns" ? "bg-[var(--text-link)] text-white" : "bg-[var(--bg-primary)] text-[var(--text-secondary)] border border-[var(--border)]"}`}>
          <RotateCcw className="w-4 h-4 inline mr-1" /> Retours ({returns.length})
        </button>
      </div>

      {tab === "orders" && (
        <div className="bg-[var(--bg-primary)] rounded-2xl border-2 border-[var(--border)] p-6">
          <div className="flex items-center gap-3 mb-4">
            <input value={orderSearch} onChange={e => setOrderSearch(e.target.value)} placeholder="Rechercher une commande..." className="flex-1 rounded-xl border-2 border-[var(--border)] bg-[var(--bg-secondary)] px-4 py-2 text-sm text-[var(--text-primary)]" />
            <Search className="w-5 h-5 text-[var(--text-secondary)]" />
          </div>
          <div className="space-y-3">
            {orders.filter((o: Order) => !orderSearch || o.id.includes(orderSearch)).slice(0, 20).map((order: Order) => (
              <div key={order.id} className="flex items-center justify-between p-4 rounded-xl bg-[var(--bg-secondary)]">
                <div>
                  <p className="font-semibold text-sm text-[var(--text-primary)]">{order.id}</p>
                  <p className="text-xs text-[var(--text-secondary)]">{order.customerName} - {new Date(order.createdAt).toLocaleDateString("fr-FR")}</p>
                  <p className="text-xs text-[var(--text-link)]">{statusLabels[order.status] || order.status}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-sm text-[var(--text-primary)]">{Number(order.total).toLocaleString("fr-FR")} F</p>
                  <button onClick={() => handleInvoice(order.id)} className="text-xs text-[var(--text-link)] hover:underline">Facture / BL</button>
                </div>
              </div>
            ))}
            {orders.length === 0 && <EmptyState icon={ShoppingCart} title="Aucune commande" description="Il n'y a aucune commande à afficher pour le moment." />}
          </div>
        </div>
      )}

      {tab === "returns" && (
        <div className="bg-[var(--bg-primary)] rounded-2xl border-2 border-[var(--border)] p-6">
          <div className="space-y-3">
            {returns.map((ret: ReturnRequest) => (
              <div key={ret.id} className="p-4 rounded-xl bg-[var(--bg-secondary)]">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="font-semibold text-sm text-[var(--text-primary)]">{ret.productName}</p>
                    <p className="text-xs text-[var(--text-secondary)]">Commande: {ret.orderId} - {ret.userName}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-lg text-xs font-semibold ${ret.status === 'pending' ? 'bg-yellow-500/10 text-yellow-400' : ret.status === 'approved' ? 'bg-blue-500/10 text-blue-400' : ret.status === 'refunded' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>{ret.status}</span>
                </div>
                <p className="text-sm text-[var(--text-secondary)] mb-3">Motif: {ret.reason}</p>
                {ret.status === "pending" && (
                  <div className="flex gap-2">
                    <button onClick={() => handleReturnAction(ret.id, "approved")} className="px-3 py-1.5 rounded-lg bg-green-500/10 text-green-400 text-xs font-semibold hover:bg-green-500/20">Approuver</button>
                    <button onClick={() => handleReturnAction(ret.id, "rejected")} className="px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 text-xs font-semibold hover:bg-red-500/20">Refuser</button>
                  </div>
                )}
                {ret.status === "approved" && (
                  <button onClick={() => handleReturnAction(ret.id, "refunded", ret.refundAmount)} className="px-3 py-1.5 rounded-lg bg-[var(--text-link)]/10 text-[var(--text-link)] text-xs font-semibold">
                    Rembourser ({Number(ret.refundAmount || 0).toLocaleString("fr-FR")} F)
                  </button>
                )}
              </div>
            ))}
            {returns.length === 0 && <EmptyState icon={RotateCcw} title="Aucun retour" description="Il n'y a aucune demande de retour pour le moment." />}
          </div>
        </div>
      )}
    </div>
  )
}

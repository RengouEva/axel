"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Package, ArrowLeft, MapPin, CreditCard, Truck, CheckCircle, Clock } from "lucide-react"
import Button from "@/components/ui/button"
import Badge from "@/components/ui/badge"
import { useAuth } from "@/lib/auth-context"
import Link from "next/link"

const statusColors: Record<string, "promo" | "stock" | "credit"> = {
  "delivered": "stock",
  "shipped": "credit",
  "processing": "promo",
  "pending": "credit",
  "cancelled": "promo",
}

const statusLabels: Record<string, string> = {
  "pending": "En attente",
  "processing": "En cours",
  "shipped": "Expédié",
  "delivered": "Livré",
  "cancelled": "Annulé",
}

export default function OrderDetailPage() {
  const params = useParams()
  const id = params.id as string
  const { getAuthHeaders } = useAuth()
  const [order, setOrder] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/orders", { headers: getAuthHeaders() })
      .then(r => r.json())
      .then(data => {
        const found = data.orders?.find((o: any) => o.id === id)
        setOrder(found || null)
      })
      .catch(() => setOrder(null))
      .finally(() => setLoading(false))
  }, [id, getAuthHeaders])

  if (loading) {
    return (
      <div className="w-full min-h-screen bg-[var(--bg-primary)] flex items-center justify-center py-20">
        <p className="text-[var(--text-secondary)]">Chargement...</p>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="w-full min-h-screen bg-[var(--bg-primary)] flex items-center justify-center py-20">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">Commande introuvable</h1>
          <Link href="/compte/commandes"><Button variant="outline">Voir mes commandes</Button></Link>
        </div>
      </div>
    )
  }

  const statusLabel = statusLabels[order.status] || order.status
  const firstItem = order.items?.[0]

  return (
    <div className="w-full min-h-screen bg-[var(--bg-primary)]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/compte/commandes" className="p-2 rounded-xl hover:bg-[var(--bg-secondary)] transition-colors"><ArrowLeft className="w-5 h-5 text-[var(--text-secondary)]" /></Link>
          <div>
            <h1 className="text-4xl font-bold text-[var(--text-primary)]">Détail de la commande</h1>
            <p className="text-sm text-[var(--text-secondary)]">{order.id}</p>
          </div>
        </div>

        <div className="grid gap-6">
          <div className="p-6 rounded-2xl border-2 border-[var(--border)]">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-xl bg-[var(--bg-secondary)] overflow-hidden flex items-center justify-center">
                  {firstItem ? (
                    <img src={firstItem.image || "/images/visuel.png"} alt={firstItem.name} className="w-full h-full object-cover" />
                  ) : (
                    <Package className="w-8 h-8 text-[var(--text-secondary)]" />
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-[var(--text-primary)]">{firstItem?.name || "Produit"}</h3>
                  <p className="text-sm text-[var(--text-secondary)]">{new Date(order.date).toLocaleDateString("fr-FR")}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-[var(--text-primary)]">{Number(order.total).toLocaleString("fr-FR")} F</p>
                <Badge variant={statusColors[order.status] || "credit"}>{statusLabel}</Badge>
              </div>
            </div>
          </div>

          {order.status === "delivered" && (
            <div className="p-6 rounded-2xl border-2 border-[var(--border)]">
              <h3 className="font-semibold text-[var(--text-primary)] mb-2 flex items-center gap-2">
                <Truck className="w-5 h-5 text-[var(--text-link)]" /> Suivi de livraison
              </h3>
              <p className="text-sm text-[var(--text-secondary)] mb-4">Colis livré avec succès</p>
              <div className="flex items-center gap-2 text-sm text-green-600 font-semibold">
                <CheckCircle className="w-4 h-4" /> Livré le {new Date(order.date).toLocaleDateString("fr-FR")}
              </div>
            </div>
          )}

          <div className="p-6 rounded-2xl border-2 border-[var(--border)]">
            <h3 className="font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-[var(--text-link)]" /> Suivi de la commande
            </h3>
            <div className="relative pl-6 border-l-2 border-[var(--border-hover)]/30 space-y-6">
              <div className="relative">
                <div className="absolute -left-[25px] w-4 h-4 rounded-full border-2 bg-[var(--text-link)] border-[var(--border-hover)]" />
                <p className="font-semibold text-[var(--text-primary)] text-sm">Commande confirmée</p>
                <p className="text-xs text-[var(--text-secondary)]">{new Date(order.date).toLocaleDateString("fr-FR")}</p>
              </div>
              {order.status === "shipped" || order.status === "delivered" ? (
                <div className="relative">
                  <div className={`absolute -left-[25px] w-4 h-4 rounded-full border-2 ${order.status === "delivered" ? "bg-[var(--text-link)] border-[var(--border-hover)]" : "bg-[var(--bg-primary)] border-[var(--border-hover)]"}`} />
                  <p className="font-semibold text-[var(--text-primary)] text-sm">Expédié</p>
                  <p className="text-xs text-[var(--text-secondary)]">{new Date(order.date).toLocaleDateString("fr-FR")}</p>
                </div>
              ) : null}
              {order.status === "delivered" ? (
                <div className="relative">
                  <div className="absolute -left-[25px] w-4 h-4 rounded-full border-2 bg-[var(--text-link)] border-[var(--border-hover)]" />
                  <p className="font-semibold text-[var(--text-primary)] text-sm">Livré</p>
                  <p className="text-xs text-[var(--text-secondary)]">{new Date(order.date).toLocaleDateString("fr-FR")}</p>
                </div>
              ) : null}
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-6">
            <div className="p-6 rounded-2xl border-2 border-[var(--border)]">
              <h3 className="font-semibold text-[var(--text-primary)] mb-2 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-[var(--text-link)]" /> Adresse de livraison
              </h3>
              <p className="text-sm text-[var(--text-secondary)]">{order.shippingAddress || "Non renseignée"}</p>
            </div>
            <div className="p-6 rounded-2xl border-2 border-[var(--border)]">
              <h3 className="font-semibold text-[var(--text-primary)] mb-2 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-[var(--text-link)]" /> Paiement
              </h3>
              <p className="text-sm text-[var(--text-secondary)]">{order.deliveryMethod || "Standard"}</p>
              <p className="text-sm text-[var(--text-secondary)]">{Number(order.total).toLocaleString("fr-FR")} F</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
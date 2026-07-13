"use client"

import { useState, useEffect } from "react"
import { ShoppingCart, DollarSign, Users, Star, ArrowUp, ArrowDown, Store } from "lucide-react"
import { AnimatedDiv } from "@/lib/animations"
import Button from "@/components/ui/button"
import { useAuth } from "@/lib/auth-context"
import Link from "next/link"

const statusLabels: Record<string, string> = {
  "pending": "En attente",
  "processing": "En cours",
  "shipped": "Expédié",
  "delivered": "Livré",
  "cancelled": "Annulé",
}

export default function SellerPage() {
  const { getAuthHeaders } = useAuth()
  const [orders, setOrders] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch("/api/orders", { headers: getAuthHeaders() }).then(r => r.json()),
      fetch("/api/products?limit=5", { headers: getAuthHeaders() }).then(r => r.json()),
    ])
      .then(([ordersData, productsData]) => {
        setOrders(ordersData.orders || [])
        setProducts(productsData.products || [])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [getAuthHeaders])

  const totalRevenue = orders.reduce((sum, o) => sum + Number(o.total || 0), 0)
  const totalOrders = orders.length
  const deliveredOrders = orders.filter(o => o.status === "delivered").length
  const avgRating = products.length > 0 ? Math.min(5, Math.round((products.reduce((sum, p) => sum + Number(p.rating || 0), 0) / products.length) * 10) / 10) : 0

  const statsCards = [
    { icon: DollarSign, label: "Revenus", value: `${totalRevenue.toLocaleString("fr-FR")} F`, change: "", up: true, color: "#1769F2" },
    { icon: ShoppingCart, label: "Commandes", value: totalOrders.toString(), change: "", up: true, color: "#0B4FC8" },
    { icon: Users, label: "Visiteurs", value: "-", change: "", up: true, color: "#061A4A" },
    { icon: Star, label: "Note moyenne", value: avgRating > 0 ? avgRating.toString() : "-", change: "", up: true, color: "#1769F2" },
  ]

  const recentOrders = orders.slice(0, 5)

  if (loading) {
    return (
      <div className="w-full min-h-screen bg-[var(--bg-secondary)] flex items-center justify-center py-20">
        <p className="text-[var(--text-secondary)]">Chargement...</p>
      </div>
    )
  }

  return (
    <div className="w-full min-h-screen bg-[var(--bg-secondary)]">
      <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-[var(--text-primary)]">Tableau de bord vendeur</h1>
            <p className="text-[var(--text-secondary)]">Gérez vos ventes et votre boutique</p>
          </div>
          <div className="flex gap-3">
            <Link href="/vendeur/boutique"><Button variant="outline"><Store className="w-4 h-4" /> Ma boutique</Button></Link>
            <Link href="/produits"><Button>Voir la boutique</Button></Link>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statsCards.map((s, i) => {
            const Icon = s.icon
            return (
              <AnimatedDiv key={s.label} fade slideUp delay={i * 0.05} className="p-6 rounded-2xl bg-[var(--bg-primary)] border-2 border-[var(--border)]">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${s.color}15` }}><Icon className="w-5 h-5" style={{ color: s.color }} /></div>
                </div>
                <p className="text-2xl font-bold text-[var(--text-primary)]">{s.value}</p>
                <p className="text-xs text-[var(--text-secondary)]">{s.label}</p>
              </AnimatedDiv>
            )
          })}
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          <AnimatedDiv fade slideUp className="bg-[var(--bg-primary)] rounded-2xl border-2 border-[var(--border)] p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-[var(--text-primary)]">Dernières commandes</h2>
              <Link href="/vendeur" className="text-sm text-[var(--text-link)] font-semibold">Voir tout</Link>
            </div>
            <div className="space-y-3">
              {recentOrders.length === 0 ? (
                <p className="text-sm text-[var(--text-secondary)] text-center py-4">Aucune commande pour le moment</p>
              ) : recentOrders.map((order) => {
                const firstItem = order.items?.[0]
                return (
                  <div key={order.id} className="flex items-center justify-between p-3 rounded-xl bg-[var(--bg-secondary)]">
                    <div>
                      <p className="font-semibold text-sm text-[var(--text-primary)]">{firstItem?.name || "Produit"}</p>
                      <p className="text-xs text-[var(--text-secondary)]">{order.user?.name || "Client"} - {order.id}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-sm text-[var(--text-primary)]">{Number(order.total).toLocaleString("fr-FR")} F</p>
                      <p className="text-xs text-[var(--text-link)]">{statusLabels[order.status] || order.status}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </AnimatedDiv>

          <AnimatedDiv fade slideUp delay={0.05} className="bg-[var(--bg-primary)] rounded-2xl border-2 border-[var(--border)] p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-[var(--text-primary)]">Produits en vedette</h2>
              <Link href="/vendeur/boutique" className="text-sm text-[var(--text-link)] font-semibold">Gérer</Link>
            </div>
            <div className="space-y-3">
              {products.length === 0 ? (
                <p className="text-sm text-[var(--text-secondary)] text-center py-4">Aucun produit pour le moment</p>
              ) : products.slice(0, 5).map((p) => (
                <div key={p.id} className="flex items-center justify-between p-3 rounded-xl bg-[var(--bg-secondary)]">
                  <p className="font-semibold text-sm text-[var(--text-primary)]">{p.name}</p>
                  <div className="text-right">
                    <p className="font-semibold text-sm text-[var(--text-primary)]">{Number(p.price).toLocaleString("fr-FR")} F</p>
                    <p className="text-xs text-[var(--text-secondary)]">{p.inStock ? "En stock" : "Rupture"}</p>
                  </div>
                </div>
              ))}
            </div>
          </AnimatedDiv>
        </div>
      </div>
    </div>
  )
}

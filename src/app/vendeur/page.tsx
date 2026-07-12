"use client"

import { Package, ShoppingCart, DollarSign, Users, Star, ArrowUp, ArrowDown, Store } from "lucide-react"
import { AnimatedDiv } from "@/lib/animations"
import Button from "@/components/ui/button"
import Link from "next/link"

const stats = [
  { icon: DollarSign, label: "Revenus du mois", value: "2 450 000 F", change: "+12.5%", up: true, color: "#1769F2" },
  { icon: ShoppingCart, label: "Commandes", value: "47", change: "+8.3%", up: true, color: "#0B4FC8" },
  { icon: Users, label: "Visiteurs", value: "3 245", change: "+23.1%", up: true, color: "#061A4A" },
  { icon: Star, label: "Note moyenne", value: "4.8", change: "+0.2", up: true, color: "#1769F2" },
]

const recentOrders = [
  { id: "CMD-001", product: "iPhone 16 Pro Max", client: "Kouamé J.", total: "1 599 000 F", status: "Livré" },
  { id: "CMD-002", product: "AirPods Pro 3", client: "Fatou S.", total: "299 000 F", status: "En cours" },
  { id: "CMD-003", product: "MacBook Pro 16\"", client: "Moussa D.", total: "3 499 000 F", status: "Traitement" },
]

export default function SellerPage() {
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
            <Link href="/vendeur/produits"><Button variant="outline"><Package className="w-4 h-4" /> Gérer les produits</Button></Link>
            <Link href="/produits"><Button>Voir la boutique</Button></Link>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((s, i) => {
            const Icon = s.icon
            return (
              <AnimatedDiv key={s.label} fade slideUp delay={i * 0.05} className="p-6 rounded-2xl bg-[var(--bg-primary)] border-2 border-[var(--border)]">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${s.color}15` }}><Icon className="w-5 h-5" style={{ color: s.color }} /></div>
                  <span className={`flex items-center gap-1 text-xs font-semibold ${s.up ? "text-green-600" : "text-red-600"}`}>
                    {s.up ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}{s.change}
                  </span>
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
              {recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between p-3 rounded-xl bg-[var(--bg-secondary)]">
                  <div><p className="font-semibold text-sm text-[var(--text-primary)]">{order.product}</p>                  <p className="text-xs text-[var(--text-secondary)]">{order.client} - {order.id}</p></div>
                  <div className="text-right"><p className="font-semibold text-sm text-[var(--text-primary)]">{order.total}</p><p className="text-xs text-[var(--text-link)]">{order.status}</p></div>
                </div>
              ))}
            </div>
          </AnimatedDiv>

          <AnimatedDiv fade slideUp delay={0.05} className="bg-[var(--bg-primary)] rounded-2xl border-2 border-[var(--border)] p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-[var(--text-primary)]">Produits en vedette</h2>
              <Link href="/vendeur/produits" className="text-sm text-[var(--text-link)] font-semibold">Gérer</Link>
            </div>
            <div className="space-y-3">
              {[
                { name: "iPhone 16 Pro Max", price: "1 599 000 F", stock: 12 },
                { name: "MacBook Pro 16\" M4", price: "3 499 000 F", stock: 5 },
                { name: "Samsung Galaxy S25 Ultra", price: "1 399 000 F", stock: 8 },
              ].map((p) => (
                <div key={p.name} className="flex items-center justify-between p-3 rounded-xl bg-[var(--bg-secondary)]">
                  <p className="font-semibold text-sm text-[var(--text-primary)]">{p.name}</p>
                  <div className="text-right"><p className="font-semibold text-sm text-[var(--text-primary)]">{p.price}</p><p className="text-xs text-[var(--text-secondary)]">{p.stock} en stock</p></div>
                </div>
              ))}
            </div>
          </AnimatedDiv>
        </div>
      </div>
    </div>
  )
}

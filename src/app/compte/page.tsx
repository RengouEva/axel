"use client"

import { Package, Heart, CreditCard, User, Settings, LogOut, ShoppingBag, DollarSign, Star, Truck, BarChart3, Users, Store } from "lucide-react"
import Button from "@/components/ui/button"
import { AnimatedDiv } from "@/lib/animations"
import { useAuth } from "@/lib/auth-context"
import Link from "next/link"
import { useState, useEffect } from "react"

const clientLinks = [
  { icon: Package, label: "Mes commandes", desc: "Suivez vos commandes", href: "/compte/commandes", color: "#1769F2" },
  { icon: Heart, label: "Mes favoris", desc: "Produits sauvegardés", href: "/compte/favoris", color: "#ef4444" },
  { icon: CreditCard, label: "Mon crédit", desc: "Gérez votre crédit", href: "/compte/credit", color: "#0B4FC8" },
  { icon: User, label: "Mon profil", desc: "Informations personnelles", href: "/compte/profil", color: "#061A4A" },
  { icon: Settings, label: "Paramètres", desc: "Préférences du compte", href: "/compte/parametres", color: "#64748B" },
  { icon: Truck, label: "Suivi livraison", desc: "Suivez vos colis", href: "/livraison", color: "#1769F2" },
]

const sellerLinks = [
  { icon: BarChart3, label: "Tableau de bord", desc: "Vue d'ensemble des ventes", href: "/vendeur", color: "#1769F2" },
  { icon: Package, label: "Mes produits", desc: "Gérer le catalogue", href: "/vendeur/produits", color: "#0B4FC8" },
  { icon: Truck, label: "Livraisons", desc: "Suivi des missions", href: "/vendeur/livraison", color: "#061A4A" },
  { icon: DollarSign, label: "Revenus", desc: "Historique des ventes", href: "/vendeur", color: "#059669" },
  { icon: User, label: "Mon profil", desc: "Informations personnelles", href: "/compte/profil", color: "#64748B" },
  { icon: Settings, label: "Paramètres", desc: "Préférences", href: "/compte/parametres", color: "#64748B" },
]

const adminLinks = [
  { icon: Users, label: "Utilisateurs", desc: "Gérer les comptes", href: "/admin", color: "#1769F2" },
  { icon: Package, label: "Produits", desc: "Tous les produits", href: "/admin/produits", color: "#0B4FC8" },
  { icon: Truck, label: "Commandes", desc: "Toutes les commandes", href: "/admin/commandes", color: "#061A4A" },
  { icon: BarChart3, label: "Statistiques", desc: "Analyses de la plateforme", href: "/admin/stats", color: "#059669" },
  { icon: Store, label: "Boutiques", desc: "Gérer les boutiques", href: "/admin/boutiques", color: "#D97706" },
  { icon: CreditCard, label: "Crédits", desc: "Demandes de crédit", href: "/admin/credits", color: "#0B4FC8" },
  { icon: User, label: "Mon profil", desc: "Informations personnelles", href: "/compte/profil", color: "#64748B" },
  { icon: Settings, label: "Paramètres", desc: "Préférences", href: "/compte/parametres", color: "#64748B" },
]

const roleBadge: Record<string, { label: string; color: string }> = {
  client: { label: "Client", color: "#1769F2" },
  seller: { label: "Vendeur", color: "#059669" },
  admin: { label: "Administrateur", color: "#D97706" },
}

export default function AccountPage() {
  const { user, logout, getAuthHeaders } = useAuth()
  const initial = user?.name?.charAt(0) || "?"
  const role = user?.role || "client"
  const badge = roleBadge[role] || roleBadge.client
  const links = role === "seller" ? sellerLinks : role === "admin" ? adminLinks : clientLinks
  const [stats, setStats] = useState<{ orders: number; favorites: number } | null>(null)
  const [sellerStats, setSellerStats] = useState<any>(null)
  const [adminStats, setAdminStats] = useState<any>(null)

  useEffect(() => {
    if (role === "client") {
      const favs = JSON.parse(localStorage.getItem("axel-favorites") || "[]")
      fetch("/api/orders", { headers: getAuthHeaders() })
        .then(r => r.json())
        .then(data => {
          setStats({ orders: data.total || 0, favorites: favs.length || 0 })
        })
        .catch(() => {
          setStats({ orders: 0, favorites: favs.length || 0 })
        })
    }
    if (role === "seller") {
      Promise.all([
        fetch("/api/orders", { headers: getAuthHeaders() }).then(r => r.json()),
        fetch("/api/products", { headers: getAuthHeaders() }).then(r => r.json()),
      ])
        .then(([ordersData, productsData]) => {
          const totalRevenue = (ordersData.orders || []).reduce((sum: number, o: any) => sum + Number(o.total || 0), 0)
          setSellerStats({
            revenue: totalRevenue,
            orders: ordersData.total || 0,
            products: productsData.total || 0,
          })
        })
        .catch(() => {})
    }
    if (role === "admin") {
      fetch("/api/admin/stats", { headers: getAuthHeaders() })
        .then(r => r.json())
        .then(data => {
          setAdminStats(data.stats)
        })
        .catch(() => {})
    }
  }, [role, getAuthHeaders])

  return (
    <div className="w-full min-h-screen bg-[var(--bg-primary)]">
      <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AnimatedDiv fade slideUp>
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl gradient-axel flex items-center justify-center text-white text-2xl font-bold">{initial}</div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold text-[var(--text-primary)]">Bonjour, {user?.name || "Cher visiteur"} !</h1>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold" style={{ backgroundColor: `${badge.color}15`, color: badge.color }}>
                    {badge.label}
                  </span>
                </div>
                <p className="text-[var(--text-secondary)]">{user?.email}</p>
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-3">
              {role === "admin" && (
                <Link href="/admin"><Button size="sm"><Store className="w-4 h-4" /> Administration</Button></Link>
              )}
              {role === "seller" && (
                <Link href="/vendeur"><Button size="sm"><Store className="w-4 h-4" /> Espace vendeur</Button></Link>
              )}
              {role === "client" && (
                <Link href="/a-credit"><Button size="sm" variant="outline"><CreditCard className="w-4 h-4" /> Acheter à crédit</Button></Link>
              )}
              <button onClick={logout} className="p-2 rounded-xl hover:bg-red-50 text-[var(--text-secondary)] hover:text-red-500 transition-colors" title="Déconnexion">
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </AnimatedDiv>

        {role === "client" && (
          <div className="grid sm:grid-cols-3 gap-6 mb-12">
            {[
              { icon: ShoppingBag, label: "Commandes", value: stats?.orders?.toString() || "0", color: "#1769F2" },
              { icon: Heart, label: "Favoris", value: stats?.favorites?.toString() || "0", color: "#ef4444" },
              { icon: CreditCard, label: "Crédit", value: "Aucun", color: "#0B4FC8" },
            ].map((stat) => {
              const Icon = stat.icon
              return (
                <div key={stat.label} className="p-6 rounded-2xl border-2 border-[var(--border)]">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${stat.color}15` }}>
                      <Icon className="w-5 h-5" style={{ color: stat.color }} />
                    </div>
                    <span className="text-sm text-[var(--text-secondary)]">{stat.label}</span>
                  </div>
                  <p className="text-2xl font-bold text-[var(--text-primary)]">{stat.value}</p>
                </div>
              )
            })}
          </div>
        )}

        {role === "seller" && (
          <div className="grid sm:grid-cols-4 gap-6 mb-12">
            {[
              { icon: DollarSign, label: "Revenus", value: sellerStats ? `${sellerStats.revenue.toLocaleString("fr-FR")} F` : "0 F", color: "#1769F2" },
              { icon: ShoppingBag, label: "Commandes", value: sellerStats?.orders?.toString() || "0", color: "#0B4FC8" },
              { icon: Star, label: "Note moyenne", value: "-", color: "#059669" },
              { icon: Package, label: "Produits", value: sellerStats?.products?.toString() || "0", color: "#061A4A" },
            ].map((stat) => {
              const Icon = stat.icon
              return (
                <div key={stat.label} className="p-6 rounded-2xl border-2 border-[var(--border)]">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${stat.color}15` }}>
                      <Icon className="w-5 h-5" style={{ color: stat.color }} />
                    </div>
                    <span className="text-sm text-[var(--text-secondary)]">{stat.label}</span>
                  </div>
                  <p className="text-2xl font-bold text-[var(--text-primary)]">{stat.value}</p>
                </div>
              )
            })}
          </div>
        )}

        {role === "admin" && (
          <div className="grid sm:grid-cols-4 gap-6 mb-12">
            {[
              { icon: Users, label: "Utilisateurs", value: adminStats?.totalUsers?.toString() || "0", color: "#1769F2" },
              { icon: Package, label: "Produits", value: adminStats?.totalProducts?.toString() || "0", color: "#0B4FC8" },
              { icon: Truck, label: "Commandes", value: adminStats?.totalOrders?.toString() || "0", color: "#059669" },
              { icon: DollarSign, label: "Revenus totaux", value: adminStats ? `${(adminStats.totalRevenue / 1000).toFixed(1)}K F` : "0 F", color: "#D97706" },
            ].map((stat) => {
              const Icon = stat.icon
              return (
                <div key={stat.label} className="p-6 rounded-2xl border-2 border-[var(--border)]">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${stat.color}15` }}>
                      <Icon className="w-5 h-5" style={{ color: stat.color }} />
                    </div>
                    <span className="text-sm text-[var(--text-secondary)]">{stat.label}</span>
                  </div>
                  <p className="text-2xl font-bold text-[var(--text-primary)]">{stat.value}</p>
                </div>
              )
            })}
          </div>
        )}

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {links.map((link) => {
            const Icon = link.icon
            return (
              <Link key={link.label} href={link.href}>
                <AnimatedDiv fade slideUp className="flex items-center gap-4 p-4 rounded-2xl border-2 border-[var(--border)] hover:border-[var(--border-hover)]/30 hover:shadow-axel-lg transition-all duration-300 group">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform" style={{ backgroundColor: `${link.color}15` }}>
                    <Icon className="w-5 h-5" style={{ color: link.color }} />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-[var(--text-primary)]">{link.label}</p>
                    <p className="text-xs text-[var(--text-secondary)]">{link.desc}</p>
                  </div>
                </AnimatedDiv>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}

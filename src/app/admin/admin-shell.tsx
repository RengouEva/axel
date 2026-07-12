"use client"

import { useState, type ReactNode } from "react"
import {
  LayoutDashboard, Users, Store, Package, Grid3X3, ShoppingCart, Wallet,
  CreditCard, DollarSign, BookOpen, BarChart3, FileText, Activity, TrendingUp,
  Menu, Shield, LogOut, ChevronRight, Percent, Gem
} from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { usePathname } from "next/navigation"
import Link from "next/link"

const navItems = [
  { section: "Général", items: [
    { icon: LayoutDashboard, label: "Dashboard", href: "/admin" },
  ]},
  { section: "Gestion", items: [
    { icon: Users, label: "Utilisateurs", href: "/admin/utilisateurs" },
    { icon: Store, label: "Boutiques", href: "/admin/boutiques" },
    { icon: Package, label: "Produits", href: "/admin/produits" },
    { icon: Grid3X3, label: "Catégories", href: "/admin/categories" },
    { icon: ShoppingCart, label: "Commandes", href: "/admin/commandes" },
    { icon: Gem, label: "Abonnements", href: "/admin/abonnements" },
  ]},
  { section: "Finance", items: [
    { icon: Wallet, label: "Paiements", href: "/admin/paiements" },
    { icon: CreditCard, label: "Crédits", href: "/admin/credits" },
    { icon: DollarSign, label: "Finance", href: "/admin/finance" },
    { icon: BookOpen, label: "Comptabilité", href: "/admin/comptabilite" },
    { icon: Percent, label: "Taxes", href: "/admin/taxes" },
  ]},
  { section: "Analyse", items: [
    { icon: BarChart3, label: "Rapports", href: "/admin/rapports" },
    { icon: TrendingUp, label: "Statistiques", href: "/admin/stats" },
  ]},
  { section: "Système", items: [
    { icon: FileText, label: "CMS", href: "/admin/cms" },
    { icon: Activity, label: "Logs", href: "/admin/logs" },
  ]},
]

export default function AdminShell({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  if (!user || user.role !== "admin") {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-16 h-16 text-[var(--text-link)]/50 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Accès restreint</h1>
          <p className="text-[var(--text-secondary)] mb-6">Vous devez Ãªtre administrateur.</p>
          <Link href="/compte" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[var(--text-link)] text-white text-sm font-semibold hover:bg-[#0B4FC8] transition-colors">Retour</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex">
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-[var(--bg-card)] border-r border-[var(--border)] transform transition-transform duration-300 lg:translate-x-0 lg:static flex flex-col ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="h-16 flex items-center gap-3 px-6 border-b border-[var(--border)] shrink-0">
          <div className="w-8 h-8 rounded-lg gradient-axel flex items-center justify-center text-white text-xs font-bold">A</div>
          <div>
            <p className="text-sm font-bold text-white">AXEL Admin</p>
            <p className="text-[10px] text-[var(--text-secondary)]">Espace administration</p>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-6 overflow-y-auto">
          {navItems.map((group) => (
            <div key={group.section}>
              <p className="text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2 px-3">{group.section}</p>
              {group.items.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                return (
                  <Link key={item.href} href={item.href} onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all mb-0.5 group ${
                      isActive ? "bg-[var(--text-link)]/10 text-[var(--text-link)] font-semibold" : "text-[var(--text-muted)] hover:text-white hover:bg-[var(--bg-elevated)]"
                    }`}>
                    <Icon className="w-4 h-4" />
                    {item.label}
                    {isActive && <ChevronRight className="w-3 h-3 ml-auto" />}
                  </Link>
                )
              })}
            </div>
          ))}
        </nav>

        <div className="shrink-0 p-4 border-t border-[var(--border)] bg-[var(--bg-card)]">
          <div className="flex items-center gap-3 mb-3 px-1">
            <div className="w-8 h-8 rounded-lg bg-[#D97706]/20 flex items-center justify-center">
              <Shield className="w-4 h-4 text-[var(--text-warning)]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">{user.name}</p>
              <p className="text-[10px] text-[var(--text-secondary)]">Administrateur</p>
            </div>
          </div>
          <button onClick={logout} className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-red-400 hover:bg-red-500/10 transition-colors w-full">
            <LogOut className="w-4 h-4" /> Déconnexion
          </button>
        </div>
      </aside>

      {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      <div className="flex-1 flex flex-col min-h-screen">
        <header className="h-16 bg-[var(--bg-card)] border-b border-[var(--border)] flex items-center justify-between px-4 lg:px-8 shrink-0">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-xl hover:bg-[var(--bg-elevated)] text-[var(--text-muted)]">
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex-1" />
          <Link href="/" className="text-xs text-[var(--text-secondary)] hover:text-white transition-colors">{"<- Retour au site"}</Link>
        </header>
        <main className="flex-1">{children}</main>
      </div>
    </div>
  )
}

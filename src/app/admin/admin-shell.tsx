"use client"

import { useState, type ReactNode } from "react"
import toast from "react-hot-toast"
import {
  LayoutDashboard, Users, Store, Package, Grid3X3, ShoppingCart, Wallet,
  CreditCard, DollarSign, BookOpen, BarChart3, FileText, Activity,
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
    { icon: Store, label: "Boutiques", href: "/admin/boutiques" },
    { icon: Users, label: "Utilisateurs", href: "/admin/utilisateurs" },
    { icon: Package, label: "Produits", href: "/admin/produits" },
    { icon: Grid3X3, label: "Catégories", href: "/admin/categories" },
    { icon: ShoppingCart, label: "Commandes", href: "/admin/commandes" },
    { icon: Gem, label: "Abonnements", href: "/admin/abonnements" },
    { icon: FileText, label: "CMS", href: "/admin/cms" },
  ]},
  { section: "Finance", items: [
    { icon: DollarSign, label: "Finance", href: "/admin/finance" },
    { icon: Wallet, label: "Paiements", href: "/admin/paiements" },
    { icon: CreditCard, label: "Crédits", href: "/admin/credits" },
    { icon: BookOpen, label: "Comptabilité", href: "/admin/comptabilite" },
    { icon: Percent, label: "Taxes", href: "/admin/taxes" },
  ]},
  { section: "Analyse", items: [
    { icon: BarChart3, label: "Statistiques", href: "/admin/stats" },
    { icon: Activity, label: "Logs", href: "/admin/logs" },
    { icon: FileText, label: "Rapports", href: "/admin/rapports" },
  ]},
]

export default function AdminShell({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  if (!user || user.role !== "admin") {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center dark">
        <div className="text-center max-w-sm mx-auto p-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#1769F2] to-[#0B4FC8] flex items-center justify-center mx-auto mb-6 shadow-lg shadow-[#1769F2]/20">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Accès restreint</h1>
          <p className="text-[var(--text-secondary)] mb-6 text-sm">Vous devez être administrateur pour accéder à cet espace.</p>
          <Link href="/compte" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#1769F2] text-white text-sm font-semibold hover:bg-[#0B4FC8] transition-all shadow-lg shadow-[#1769F2]/20">
            Retour à mon compte
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex dark">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-[var(--bg-card)] border-r border-[var(--border)] transform transition-all duration-300 ease-out lg:translate-x-0 lg:static flex flex-col ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="h-16 flex items-center gap-3 px-6 border-b border-[var(--border)] shrink-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#1769F2] to-[#0B4FC8] flex items-center justify-center shadow-sm">
            <span className="text-white text-xs font-black">A</span>
          </div>
          <div>
            <p className="text-sm font-bold text-white tracking-tight">AXEL Admin</p>
            <p className="text-[10px] text-[var(--text-secondary)]">Espace administration</p>
          </div>
        </div>

        <nav className="flex-1 py-4 px-3 space-y-6 overflow-y-auto scrollbar-thin">
          {navItems.map((group) => (
            <div key={group.section}>
              <p className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-widest mb-2 px-3">{group.section}</p>
              {group.items.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href))
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all mb-0.5 group ${
                      isActive
                        ? "bg-[var(--text-link)]/10 text-[var(--text-info)] font-semibold"
                        : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? "text-[var(--text-info)]" : "text-[var(--text-muted)] group-hover:text-[var(--text-primary)]"}`} />
                    <span className="flex-1">{item.label}</span>
                    {isActive && <div className="w-1 h-4 rounded-full bg-[var(--text-info)]" />}
                  </Link>
                )
              })}
            </div>
          ))}
        </nav>

        <div className="shrink-0 p-3 border-t border-[var(--border)]">
          <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-[var(--bg-elevated)] mb-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-600/20 flex items-center justify-center">
              <Shield className="w-4 h-4 text-amber-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate leading-tight">{user.name}</p>
              <p className="text-[10px] text-[var(--text-secondary)]">Administrateur</p>
            </div>
          </div>
          <button
            onClick={() => { logout(); toast.success("Déconnecté") }}
            className="flex items-center gap-2 w-full px-3 py-2 rounded-xl text-sm text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <LogOut className="w-4 h-4" /> Déconnexion
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-h-screen min-w-0">
        <header className="h-16 bg-[var(--bg-card)]/80 backdrop-blur-xl border-b border-[var(--border)] flex items-center justify-between px-4 lg:px-8 shrink-0 sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-xl hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] transition-colors">
              <Menu className="w-5 h-5" />
            </button>
            <div className="hidden sm:flex items-center text-sm text-[var(--text-secondary)]">
              <Link href="/" className="hover:text-[var(--text-primary)] transition-colors">Site</Link>
              <ChevronRight className="w-3 h-3 mx-2" />
              <span className="text-white">Administration</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-all">
              <ChevronRight className="w-3 h-3 rotate-180" />
              Retour au site
            </Link>
          </div>
        </header>
        <main className="flex-1">{children}</main>
      </div>
    </div>
  )
}

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
    { icon: FileText, label: "Rapports", href: "/admin/rapports" },
    { icon: Activity, label: "Logs", href: "/admin/logs" },
  ]},
]

export default function AdminShell({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  if (!user || user.role !== "admin") {
    return (
      <div className="min-h-screen bg-[#0A0E1A] flex items-center justify-center">
        <div className="text-center max-w-sm mx-auto p-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#1769F2] to-[#0B4FC8] flex items-center justify-center mx-auto mb-6 shadow-lg shadow-[#1769F2]/20">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Accès restreint</h1>
          <p className="text-[#94A3B8] mb-6 text-sm">Vous devez être administrateur pour accéder à cet espace.</p>
          <Link href="/compte" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#1769F2] text-white text-sm font-semibold hover:bg-[#0B4FC8] transition-all shadow-lg shadow-[#1769F2]/20">
            Retour à mon compte
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0A0E1A] flex">
      {/* Overlay mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#0F1421] border-r border-white/5 transform transition-all duration-300 ease-out lg:translate-x-0 lg:static flex flex-col ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="h-16 flex items-center gap-3 px-6 border-b border-white/5 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#1769F2] to-[#0B4FC8] flex items-center justify-center shadow-sm">
            <span className="text-white text-xs font-black">A</span>
          </div>
          <div>
            <p className="text-sm font-bold text-white tracking-tight">AXEL Admin</p>
            <p className="text-[10px] text-[#64748B]">Espace administration</p>
          </div>
        </div>

        <nav className="flex-1 py-4 px-3 space-y-6 overflow-y-auto scrollbar-thin">
          {navItems.map((group) => (
            <div key={group.section}>
              <p className="text-[10px] font-semibold text-[#475569] uppercase tracking-widest mb-2 px-3">{group.section}</p>
              {group.items.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all mb-0.5 group ${
                      isActive
                        ? "bg-[#1769F2]/10 text-[#60A5FA] font-semibold"
                        : "text-[#64748B] hover:text-white hover:bg-white/5"
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? "text-[#60A5FA]" : "text-[#475569] group-hover:text-white"}`} />
                    <span className="flex-1">{item.label}</span>
                    {isActive && <div className="w-1 h-4 rounded-full bg-[#60A5FA]" />}
                  </Link>
                )
              })}
            </div>
          ))}
        </nav>

        <div className="shrink-0 p-3 border-t border-white/5">
          <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-white/[0.03] mb-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-600/20 flex items-center justify-center">
              <Shield className="w-4 h-4 text-amber-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate leading-tight">{user.name}</p>
              <p className="text-[10px] text-[#64748B]">Administrateur</p>
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

      {/* Main */}
      <div className="flex-1 flex flex-col min-h-screen min-w-0">
        {/* Header */}
        <header className="h-16 bg-[#0F1421]/80 backdrop-blur-xl border-b border-white/5 flex items-center justify-between px-4 lg:px-8 shrink-0 sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl hover:bg-white/5 text-[#64748B] transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="hidden sm:flex items-center text-sm text-[#64748B]">
              <Link href="/" className="hover:text-white transition-colors">Site</Link>
              <ChevronRight className="w-3 h-3 mx-2" />
              <span className="text-white">Administration</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-[#64748B] hover:text-white hover:bg-white/5 transition-all">
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

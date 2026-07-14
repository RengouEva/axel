"use client"

import { useState, type ReactNode } from "react"
import {
  ShieldCheck, LayoutDashboard, Package, ShoppingCart, Store, Megaphone,
  MessageSquare, BarChart3, Key, Brain, Bell, Lock, ChevronRight, Menu
} from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { usePathname } from "next/navigation"
import Link from "next/link"

const navItems = [
  { icon: LayoutDashboard, label: "Tableau de bord", href: "/vendeur/services-pro/tableau-de-bord" },
  { icon: ShieldCheck, label: "Vérification", href: "/vendeur/services-pro/verification" },
  { icon: Package, label: "Produits", href: "/vendeur/services-pro/produits" },
  { icon: ShoppingCart, label: "Commandes", href: "/vendeur/services-pro/commandes" },
  { icon: Store, label: "Boutique", href: "/vendeur/services-pro/boutique" },
  { icon: Megaphone, label: "Marketing", href: "/vendeur/services-pro/marketing" },
  { icon: MessageSquare, label: "Communication", href: "/vendeur/services-pro/communication" },
  { icon: BarChart3, label: "Rapports", href: "/vendeur/services-pro/rapports" },
  { icon: Key, label: "API", href: "/vendeur/services-pro/api" },
  { icon: Brain, label: "IA", href: "/vendeur/services-pro/ia" },
  { icon: Bell, label: "Notifications", href: "/vendeur/services-pro/notifications" },
  { icon: Lock, label: "Sécurité", href: "/vendeur/services-pro/securite" },
]

export default function ServicesProLayout({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  if (!user || user.role !== "seller") {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
        <div className="text-center">
          <Lock className="w-16 h-16 text-[var(--text-link)]/50 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Accès restreint</h1>
          <p className="text-[var(--text-secondary)] mb-6">Vous devez être un vendeur.</p>
          <Link href="/compte" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[var(--text-link)] text-white text-sm font-semibold">Retour</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex">
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-[var(--bg-card)] border-r border-[var(--border)] transform transition-transform duration-300 lg:translate-x-0 lg:static flex flex-col ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="h-16 flex items-center gap-3 px-6 border-b border-[var(--border)] shrink-0">
          <div className="w-8 h-8 rounded-lg gradient-axel flex items-center justify-center text-white text-xs font-bold">SP</div>
          <div>
            <p className="text-sm font-bold text-white">Services Pro</p>
            <p className="text-[10px] text-[var(--text-secondary)]">Module avancé vendeur</p>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href || (item.href !== "/vendeur/services-pro" && pathname.startsWith(item.href))
            return (
              <Link key={item.href} href={item.href} onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all group ${
                  isActive ? "bg-[var(--text-link)]/10 text-[var(--text-link)] font-semibold" : "text-[var(--text-muted)] hover:text-white hover:bg-[var(--bg-elevated)]"
                }`}>
                <Icon className="w-4 h-4" />
                {item.label}
                {isActive && <ChevronRight className="w-3 h-3 ml-auto" />}
              </Link>
            )
          })}
        </nav>

        <div className="shrink-0 p-4 border-t border-[var(--border)]">
          <Link href="/vendeur" className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-[var(--text-secondary)] hover:text-white hover:bg-[var(--bg-elevated)] transition-colors">
            ← Retour au tableau de bord
          </Link>
        </div>
      </aside>

      {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      <div className="flex-1 flex flex-col min-h-screen">
        <header className="h-16 bg-[var(--bg-card)] border-b border-[var(--border)] flex items-center justify-between px-4 lg:px-8 shrink-0">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-xl hover:bg-[var(--bg-elevated)] text-[var(--text-muted)]">
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex-1" />
          <Link href="/vendeur" className="text-xs text-[var(--text-secondary)] hover:text-white transition-colors">← Dashboard vendeur</Link>
        </header>
        <main className="flex-1">{children}</main>
      </div>
    </div>
  )
}

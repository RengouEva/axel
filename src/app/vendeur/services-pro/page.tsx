"use client"

import { useState, useEffect } from "react"
import { ShieldCheck, LayoutDashboard, Package, ShoppingCart, Store, Megaphone, MessageSquare, BarChart3, Key, Brain, Bell, Lock, ArrowRight, Loader2 } from "lucide-react"
import toast from "react-hot-toast"
import Link from "next/link"

const modules = [
  { icon: ShieldCheck, label: "Vérification", desc: "Badge Vendeur Vérifié", href: "/vendeur/services-pro/verification", color: "#10B981" },
  { icon: LayoutDashboard, label: "Tableau de bord", desc: "Analyses et performances", href: "/vendeur/services-pro/tableau-de-bord", color: "#1769F2" },
  { icon: Package, label: "Produits", desc: "Import, variantes, stocks", href: "/vendeur/services-pro/produits", color: "#8B5CF6" },
  { icon: ShoppingCart, label: "Commandes", desc: "Retours, factures, suivi", href: "/vendeur/services-pro/commandes", color: "#F59E0B" },
  { icon: Store, label: "Boutique", desc: "Personnalisation avancée", href: "/vendeur/services-pro/boutique", color: "#EC4899" },
  { icon: Megaphone, label: "Marketing", desc: "Promos, ventes flash, packs", href: "/vendeur/services-pro/marketing", color: "#EF4444" },
  { icon: MessageSquare, label: "Communication", desc: "Messagerie et templates", href: "/vendeur/services-pro/communication", color: "#14B8A6" },
  { icon: BarChart3, label: "Rapports", desc: "Export PDF, Excel, CSV", href: "/vendeur/services-pro/rapports", color: "#6366F1" },
  { icon: Key, label: "API", desc: "Connexion ERP, CRM", href: "/vendeur/services-pro/api", color: "#F97316" },
  { icon: Brain, label: "IA", desc: "Recommandations intelligentes", href: "/vendeur/services-pro/ia", color: "#A855F7" },
  { icon: Bell, label: "Notifications", desc: "Alertes en temps réel", href: "/vendeur/services-pro/notifications", color: "#0EA5E9" },
  { icon: Lock, label: "Sécurité", desc: "2FA, logs, équipe", href: "/vendeur/services-pro/securite", color: "#64748B" },
]

export default function ServicesProPage() {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/vendeur/services-pro")
      .then(async r => { if (!r.ok) { const err = await r.json(); toast.error(err.error || "Une erreur est survenue"); setLoading(false); return }; return r.json() })
      .then(d => { if (d) { setStats(d); setLoading(false) } })
      .catch(() => { toast.error("Une erreur est survenue"); setLoading(false) })
  }, [])

  if (loading) return <div className="w-full min-h-screen bg-[var(--bg-secondary)] flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin" style={{ color: "var(--text-link)" }} /></div>

  return (
    <div className="w-full min-h-screen bg-[var(--bg-secondary)]">
      <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-[var(--text-primary)]">Services Professionnels</h1>
            <p className="text-[var(--text-secondary)]">Des outils avancés pour développer votre activité</p>
          </div>
          {stats?.verificationStatus && (
            <div className={`px-4 py-2 rounded-xl text-sm font-semibold ${
              stats.verificationStatus === 'approved' ? 'bg-green-500/10 text-green-400' :
              stats.verificationStatus === 'pending' ? 'bg-yellow-500/10 text-yellow-400' :
              'bg-gray-500/10 text-gray-400'
            }`}>
              {stats.verificationStatus === 'approved' ? '✅ Vérifié' :
               stats.verificationStatus === 'pending' ? '⏳ En attente' : 'Non vérifié'}
            </div>
          )}
        </div>

        <p className="text-sm text-[var(--text-secondary)] mb-6">
          Ce module est indépendant du classement organique et d&apos;Axel Ads. Il améliore uniquement la gestion de votre boutique.
        </p>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {modules.map((m) => {
            const Icon = m.icon
            return (
              <Link key={m.href} href={m.href}
                className="group p-5 rounded-2xl bg-[var(--bg-primary)] border-2 border-[var(--border)] hover:border-[var(--border-hover)] transition-all">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${m.color}15` }}>
                    <Icon className="w-5 h-5" style={{ color: m.color }} />
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-[var(--text-primary)]">{m.label}</p>
                    <p className="text-xs text-[var(--text-secondary)]">{m.desc}</p>
                  </div>
                </div>
                <div className="flex items-center text-xs text-[var(--text-link)] opacity-0 group-hover:opacity-100 transition-opacity">
                  Accéder <ArrowRight className="w-3 h-3 ml-1" />
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}

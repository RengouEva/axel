"use client"

import { useEffect, useState, useCallback } from "react"
import toast from "react-hot-toast"
import {
  Store, Users, Shield, ArrowLeft, Crown, Trash2, Loader2, X,
  Sparkles, BadgeCheck, AlertTriangle, Star, TrendingUp, Headphones, Zap, Package
} from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import Button from "@/components/ui/button"
import Input from "@/components/ui/input"

interface Plan {
  id: number
  name: string
  slug: string
  price: number
  durationDays: number
  isActive: boolean
}

interface ShopItem {
  id: number
  name: string
  email: string
  role: string
  createdAt: string
  shopId?: string
  shopName?: string
}

const PREMIUM_BENEFITS = [
  { icon: Crown, label: "Badge Premium exclusif", desc: "Affiché sur votre boutique" },
  { icon: BadgeCheck, label: "Badge Vérifié", desc: "Gagnez la confiance des clients" },
  { icon: Sparkles, label: "Boutique mise en avant", desc: "Priorité dans les recherches" },
  { icon: TrendingUp, label: "Statistiques avancées", desc: "Suivez vos performances" },
  { icon: Star, label: "Produits en vedette", desc: "Mettez en avant vos articles" },
  { icon: Headphones, label: "Support prioritaire", desc: "Assistance dédiée 24/7" },
  { icon: Zap, label: "Boost de visibilité", desc: "Campagnes promotionnelles incluses" },
]

export default function AdminBoutiquesPage() {
  const { getAuthHeaders } = useAuth()
  const [shops, setShops] = useState<ShopItem[]>([])
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)

  const [premiumModal, setPremiumModal] = useState(false)
  const [premiumShop, setPremiumShop] = useState<ShopItem | null>(null)
  const [premiumPlanId, setPremiumPlanId] = useState("")
  const [premiumDuration, setPremiumDuration] = useState("30")
  const [premiumBadges, setPremiumBadges] = useState({
    hasPremiumBadge: true,
    hasVerifiedBadge: true,
    hasFeaturedBadge: false,
  })
  const [saving, setSaving] = useState(false)

  const [deleteConfirm, setDeleteConfirm] = useState<ShopItem | null>(null)
  const [deleting, setDeleting] = useState(false)

  const fetchData = useCallback(async () => {
    const headers = getAuthHeaders()
    setLoading(true)
    try {
      const [statsRes, plansRes] = await Promise.all([
        fetch("/api/admin/stats", { headers }),
        fetch("/api/plans?all=true", { headers }),
      ])
      if (statsRes.ok) {
        const data = await statsRes.json()
        const allUsers: ShopItem[] = data.users || []
        const shopUsers = data.shops || []

        const shopMap: Record<number, { id: string; name: string }> = {}
        if (Array.isArray(shopUsers)) {
          shopUsers.forEach((s: { sellerId: number; id: string; name: string }) => {
            shopMap[s.sellerId] = { id: s.id, name: s.name }
          })
        }

        setShops(
          allUsers
            .filter((u: ShopItem) => u.role === "seller")
            .map((u: ShopItem) => ({
              ...u,
              shopId: shopMap[u.id]?.id,
              shopName: shopMap[u.id]?.name || "",
            }))
        )
      }
      if (plansRes.ok) {
        const data = await plansRes.json()
        setPlans(data.plans || data || [])
      }
    } catch {
      toast.error( "Erreur lors du chargement")
    } finally {
      setLoading(false)
    }
  }, [getAuthHeaders])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleAssignPremium = async () => {
    if (!premiumShop?.shopId || !premiumPlanId) return
    const headers = getAuthHeaders()
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/shops/${premiumShop.shopId}/premium`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...headers },
        body: JSON.stringify({
          planId: Number(premiumPlanId),
          durationDays: Number(premiumDuration),
          ...premiumBadges,
        }),
      })
      if (!res.ok) throw new Error("Erreur lors de l'assignation")
      toast.success( `Premium activé pour ${premiumShop.name}`)
      setPremiumModal(false)
      setPremiumShop(null)
    } catch {
      toast.error( "Erreur lors de l'assignation du premium")
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteShop = async () => {
    if (!deleteConfirm) return
    const headers = getAuthHeaders()
    setDeleting(true)
    try {
      if (deleteConfirm.shopId) {
        await fetch(`/api/admin/shops/${deleteConfirm.shopId}`, {
          method: "DELETE",
          headers,
        })
      }
      const res = await fetch(`/api/admin/users/${deleteConfirm.id}`, {
        method: "DELETE",
        headers,
      })
      if (!res.ok) throw new Error("Erreur lors de la suppression")
      toast.success( `${deleteConfirm.name} supprimé avec succès`)
      setDeleteConfirm(null)
      fetchData()
    } catch {
      toast.error( "Erreur lors de la suppression")
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="p-4 lg:p-8 space-y-8">
      <div className="flex items-center gap-4">
        <Link href="/admin" className="p-2 rounded-xl bg-[var(--bg-card)] border border-[var(--border)] hover:border-[var(--border-hover)]/30 transition-colors">
          <ArrowLeft className="w-5 h-5 text-[var(--text-muted)]" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">Boutiques</h1>
          <p className="text-[var(--text-secondary)] text-sm">{shops.length} boutique{shops.length > 1 ? "s" : ""} inscrite{shops.length > 1 ? "s" : ""}</p>
        </div>
      </div>

      {loading ? (
        <p className="text-center text-[var(--text-secondary)] py-12">Chargement...</p>
      ) : shops.length === 0 ? (
        <div className="text-center py-12 bg-[var(--bg-card)] rounded-2xl border border-[var(--border)]">
          <Store className="w-12 h-12 text-[#1E293B] mx-auto mb-4" />
          <p className="text-[var(--text-secondary)]">Aucune boutique</p>
        </div>
      ) : (
        <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] overflow-hidden">
          <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-[var(--bg-primary)] border-b border-[var(--border)] text-xs font-semibold text-[var(--text-secondary)]">
            <div className="col-span-3">Propriétaire</div>
            <div className="col-span-3">Email</div>
            <div className="col-span-2">Boutique</div>
            <div className="col-span-2">Inscrit le</div>
            <div className="col-span-2">Actions</div>
          </div>
          {shops.map((s) => (
            <div key={s.id} className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-[var(--border)] last:border-0 items-center hover:bg-[var(--bg-primary)]/50 transition-colors">
              <div className="col-span-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#059669]/15 flex items-center justify-center">
                  <Store className="w-4 h-4 text-[var(--text-success)]" />
                </div>
                <span className="text-sm font-semibold text-white">{s.name}</span>
              </div>
              <div className="col-span-3 text-sm text-[var(--text-muted)]">{s.email}</div>
              <div className="col-span-2 text-sm text-[var(--text-muted)]">{s.shopName || "-"}</div>
              <div className="col-span-2 text-xs text-[var(--text-secondary)]">{new Date(s.createdAt).toLocaleDateString("fr-FR")}</div>
              <div className="col-span-2 flex items-center gap-2">
                {s.shopId && (
                  <>
                    <Link
                      href={`/admin/produits?shopId=${s.shopId}&shopName=${encodeURIComponent(s.shopName || "")}`}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 transition-colors"
                    >
                      <Package className="w-3 h-3" /> Produits
                    </Link>
                    <button
                      onClick={() => {
                        setPremiumShop(s)
                        setPremiumPlanId(plans.find((p) => p.isActive)?.id.toString() || "")
                        setPremiumDuration("30")
                        setPremiumBadges({ hasPremiumBadge: true, hasVerifiedBadge: true, hasFeaturedBadge: false })
                        setPremiumModal(true)
                      }}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 transition-colors"
                    >
                      <Crown className="w-3 h-3" /> Premium
                    </button>
                  </>
                )}
                <button
                  onClick={() => setDeleteConfirm(s)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-red-400 bg-red-500/10 hover:bg-red-500/20 transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {premiumModal && premiumShop && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !saving && setPremiumModal(false)} />
          <div className="relative bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl w-full max-w-lg shadow-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Crown className="w-5 h-5 text-amber-400" />
                <h3 className="text-lg font-bold text-white">Activer Premium</h3>
              </div>
              <button onClick={() => !saving && setPremiumModal(false)} className="p-1 rounded-lg hover:bg-[var(--bg-primary)] text-[var(--text-muted)]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm text-[var(--text-secondary)] mb-6">
              Activer l'abonnement premium pour la boutique de <strong className="text-white">{premiumShop.name}</strong>
            </p>

            <div className="mb-6 p-4 rounded-xl bg-gradient-to-br from-amber-500/5 to-amber-600/10 border border-amber-500/20">
              <h4 className="text-sm font-bold text-amber-400 mb-3 flex items-center gap-2">
                <Crown className="w-4 h-4" />
                Avantages premium
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {PREMIUM_BENEFITS.map((b) => {
                  const Icon = b.icon
                  return (
                    <div key={b.label} className="flex items-start gap-2.5 p-2 rounded-lg bg-black/20">
                      <Icon className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs font-semibold text-white">{b.label}</p>
                        <p className="text-[10px] text-[var(--text-secondary)]">{b.desc}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">Plan</label>
                <select value={premiumPlanId} onChange={(e) => setPremiumPlanId(e.target.value)}
                  className="w-full rounded-2xl border border-[var(--border)] bg-[var(--bg-primary)] px-4 py-3 text-white transition-all duration-300 focus:border-[var(--border-hover)] focus:outline-none focus:ring-4 focus:ring-[#1769F2]/10 text-sm">
                  <option value="">Sélectionner un plan</option>
                  {plans.filter((p) => p.isActive).map((p) => (
                    <option key={p.id} value={p.id}>{p.name} — {p.price.toLocaleString("fr-FR")} F / {p.durationDays}j</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">Durée (jours)</label>
                <Input type="number" value={premiumDuration} onChange={(e) => setPremiumDuration(e.target.value)} />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-2">Badges à attribuer</label>
                <div className="space-y-2">
                  {[
                    { key: "hasPremiumBadge", label: "Premium", icon: Crown, color: "#D97706" },
                    { key: "hasVerifiedBadge", label: "Vérifié", icon: BadgeCheck, color: "#059669" },
                    { key: "hasFeaturedBadge", label: "Mis en avant", icon: Sparkles, color: "#1769F2" },
                  ].map((b) => {
                    const Icon = b.icon
                    return (
                      <label key={b.key} className="flex items-center gap-3 px-3 py-2 rounded-xl bg-[var(--bg-primary)] cursor-pointer hover:bg-[var(--bg-elevated)] transition-colors">
                        <input type="checkbox" checked={premiumBadges[b.key as keyof typeof premiumBadges]}
                          onChange={(e) => setPremiumBadges({ ...premiumBadges, [b.key]: e.target.checked })}
                          className="w-4 h-4 rounded border-[var(--border)] text-[var(--text-link)] focus:ring-[var(--text-link)]" />
                        <Icon className="w-4 h-4" style={{ color: b.color }} />
                        <span className="text-sm text-white">{b.label}</span>
                      </label>
                    )
                  })}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-6 pt-6 border-t border-[var(--border)]">
              <Button variant="outline" size="sm" onClick={() => setPremiumModal(false)} disabled={saving}>
                Annuler
              </Button>
              <Button size="sm" onClick={handleAssignPremium} disabled={saving || !premiumPlanId || !premiumShop.shopId}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Crown className="w-4 h-4" />}
                Activer Premium
              </Button>
            </div>
          </div>
        </div>
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !deleting && setDeleteConfirm(null)} />
          <div className="relative bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl w-full max-w-sm shadow-2xl p-6 text-center">
            <div className="w-12 h-12 rounded-xl bg-red-500/15 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-6 h-6 text-red-400" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Supprimer la boutique</h3>
            <p className="text-sm text-[var(--text-secondary)] mb-6">
              Êtes-vous sûr de vouloir supprimer la boutique de <strong className="text-white">{deleteConfirm.name}</strong> ? Tous ses produits seront également supprimés.
            </p>
            <div className="flex items-center justify-center gap-3">
              <Button variant="outline" size="sm" onClick={() => setDeleteConfirm(null)} disabled={deleting}>
                Annuler
              </Button>
              <Button size="sm" onClick={handleDeleteShop} disabled={deleting}
                className="bg-red-500 hover:bg-red-600 text-white">
                {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Supprimer
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

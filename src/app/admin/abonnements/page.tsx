"use client"

import { useEffect, useState, useCallback } from "react"
import {
  Crown, Shield, Star, Check, X, Plus, Edit3, Trash2, ArrowLeft,
  AlertTriangle, Loader2, BadgeCheck, Gem, Sparkles, Store, Clock
} from "lucide-react"
import { AnimatedDiv } from "@/lib/animations"
import { useAuth } from "@/lib/auth-context"
import Button from "@/components/ui/button"
import Input from "@/components/ui/input"
import Link from "next/link"

interface Plan {
  id: number
  name: string
  slug: string
  description: string
  price: number
  durationDays: number
  maxBoosts: number
  hasPremiumBadge: boolean
  hasVerifiedBadge: boolean
  hasFeaturedBadge: boolean
  boostPrice: number
  isActive: boolean
  createdAt: string
}

interface ShopSubscription {
  plan: Plan
  status: "active" | "expired"
  endDate: string
  badges: string[]
}

interface Shop {
  id: string
  name: string
  ownerName: string
  subscription?: ShopSubscription | null
}

const emptyPlan: Plan = {
  id: 0,
  name: "",
  slug: "",
  description: "",
  price: 0,
  durationDays: 30,
  maxBoosts: 0,
  hasPremiumBadge: false,
  hasVerifiedBadge: false,
  hasFeaturedBadge: false,
  boostPrice: 0,
  isActive: true,
  createdAt: "",
}

export default function AdminAbonnementsPage() {
  const { user, getAuthHeaders } = useAuth()

  const [plans, setPlans] = useState<Plan[]>([])
  const [shops, setShops] = useState<Shop[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [planModal, setPlanModal] = useState(false)
  const [editingPlan, setEditingPlan] = useState<Plan>({ ...emptyPlan })
  const [deleteConfirm, setDeleteConfirm] = useState<Plan | null>(null)

  const [premiumModal, setPremiumModal] = useState(false)
  const [premiumShop, setPremiumShop] = useState<Shop | null>(null)
  const [premiumPlanId, setPremiumPlanId] = useState("")
  const [premiumDuration, setPremiumDuration] = useState("30")
  const [premiumBadges, setPremiumBadges] = useState({
    hasPremiumBadge: false,
    hasVerifiedBadge: false,
    hasFeaturedBadge: false,
  })

  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null)

  const showToast = useCallback((type: "success" | "error", message: string) => {
    setToast({ type, message })
    setTimeout(() => setToast(null), 4000)
  }, [])

  const fetchData = useCallback(async () => {
    const headers = getAuthHeaders()
    setLoading(true)
    try {
      const [plansRes, shopsRes] = await Promise.all([
        fetch("/api/plans?all=true", { headers }),
        fetch("/api/admin/shops", { headers }),
      ])
      if (plansRes.ok) {
        const data = await plansRes.json()
        setPlans(data.plans || data || [])
      }
      if (shopsRes.ok) {
        const data = await shopsRes.json()
        setShops(data.shops || data || [])
      }
    } catch {
      showToast("error", "Erreur lors du chargement des données")
    } finally {
      setLoading(false)
    }
  }, [showToast])

  useEffect(() => {
    if (user?.role === "admin") fetchData()
  }, [user, fetchData])

  const handleSavePlan = async () => {
    const headers = getAuthHeaders()
    setSaving(true)
    try {
      const isEdit = editingPlan.id > 0
      const res = await fetch(isEdit ? `/api/plans/${editingPlan.id}` : "/api/plans", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json", ...headers },
        body: JSON.stringify(editingPlan),
      })
      if (!res.ok) throw new Error("Erreur lors de la sauvegarde")
      showToast("success", `Plan ${isEdit ? "modifié" : "créé"} avec succès`)
      setPlanModal(false)
      setEditingPlan({ ...emptyPlan })
      fetchData()
    } catch {
      showToast("error", "Erreur lors de la sauvegarde du plan")
    } finally {
      setSaving(false)
    }
  }

  const handleDeletePlan = async (plan: Plan) => {
    const headers = getAuthHeaders()
    setSaving(true)
    try {
      const res = await fetch(`/api/plans/${plan.id}`, {
        method: "DELETE",
        headers,
      })
      if (!res.ok) throw new Error("Erreur lors de la suppression")
      showToast("success", "Plan supprimé avec succès")
      setDeleteConfirm(null)
      fetchData()
    } catch {
      showToast("error", "Erreur lors de la suppression du plan")
    } finally {
      setSaving(false)
    }
  }

  const handleAssignPremium = async () => {
    if (!premiumShop || !premiumPlanId) return
    const headers = getAuthHeaders()
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/shops/${premiumShop.id}/premium`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...headers },
        body: JSON.stringify({
          planId: Number(premiumPlanId),
          durationDays: Number(premiumDuration),
          ...premiumBadges,
        }),
      })
      if (!res.ok) throw new Error("Erreur lors de l'assignation")
      showToast("success", `Premium assigné à ${premiumShop.name}`)
      setPremiumModal(false)
      setPremiumShop(null)
      setPremiumPlanId("")
      setPremiumDuration("30")
      setPremiumBadges({ hasPremiumBadge: false, hasVerifiedBadge: false, hasFeaturedBadge: false })
      fetchData()
    } catch {
      showToast("error", "Erreur lors de l'assignation du premium")
    } finally {
      setSaving(false)
    }
  }

  const openEditPlan = (plan: Plan) => {
    setEditingPlan({ ...plan })
    setPlanModal(true)
  }

  const openCreatePlan = () => {
    setEditingPlan({ ...emptyPlan })
    setPlanModal(true)
  }

  const openPremiumModal = (shop: Shop) => {
    setPremiumShop(shop)
    setPremiumPlanId(plans.find((p) => p.isActive)?.id.toString() || "")
    setPremiumDuration("30")
    setPremiumBadges({ hasPremiumBadge: false, hasVerifiedBadge: false, hasFeaturedBadge: false })
    setPremiumModal(true)
  }

  if (!user || user.role !== "admin") {
    return (
      <div className="w-full min-h-screen bg-[var(--bg-secondary)] flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-16 h-16 text-[var(--text-muted)] mx-auto mb-4" />
          <p className="text-[var(--text-secondary)]">Accès restreint</p>
          <Link href="/compte"><Button>Retour</Button></Link>
        </div>
      </div>
    )
  }

  const badgeIcons: Record<string, { icon: typeof Crown; label: string; color: string }> = {
    premium: { icon: Crown, label: "Premium", color: "#D97706" },
    verified: { icon: BadgeCheck, label: "Vérifié", color: "#059669" },
    featured: { icon: Sparkles, label: "Mis en avant", color: "#1769F2" },
  }

  return (
    <div className="w-full min-h-screen bg-[var(--bg-secondary)]">
      {toast && (
        <div className={`fixed top-4 right-4 z-[100] px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 text-sm font-semibold border transition-all ${
          toast.type === "success"
            ? "bg-green-900/90 text-green-100 border-green-700/50"
            : "bg-red-900/90 text-red-100 border-red-700/50"
        }`}>
          {toast.type === "success" ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
          {toast.message}
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
        <div className="flex items-center gap-4">
          <Link href="/admin" className="p-2 rounded-xl bg-[var(--bg-primary)] hover:bg-[var(--bg-secondary)] transition-colors">
            <ArrowLeft className="w-5 h-5 text-[var(--text-secondary)]" />
          </Link>
          <div>
            <h1 className="text-4xl font-bold text-[var(--text-primary)]">Abonnements</h1>
            <p className="text-[var(--text-secondary)]">Gestion des plans et abonnements boutique</p>
          </div>
        </div>

        {/* Plans Section */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-[var(--text-primary)] flex items-center gap-2">
                <Gem className="w-5 h-5 text-[var(--text-link)]" /> Plans d'abonnement
              </h2>
              <p className="text-xs text-[var(--text-secondary)]">{plans.length} plans configurés</p>
            </div>
            <Button size="sm" onClick={openCreatePlan}>
              <Plus className="w-4 h-4" /> Nouveau plan
            </Button>
          </div>

          {loading ? (
            <p className="text-center text-[var(--text-secondary)] py-12">Chargement...</p>
          ) : plans.length === 0 ? (
            <div className="text-center py-12 bg-[var(--bg-primary)] rounded-2xl border-2 border-[var(--border)]">
              <Gem className="w-12 h-12 text-[#1E293B] mx-auto mb-4" />
              <p className="text-[var(--text-secondary)]">Aucun plan d'abonnement</p>
            </div>
          ) : (
            <div className="bg-[var(--bg-primary)] rounded-2xl border-2 border-[var(--border)] overflow-hidden">
              <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-[var(--bg-secondary)] border-b border-[var(--border)] text-xs font-semibold text-[var(--text-secondary)]">
                <div className="col-span-2">Plan</div>
                <div className="col-span-1">Prix</div>
                <div className="col-span-1">Durée</div>
                <div className="col-span-3">Badges</div>
                <div className="col-span-1">Boost</div>
                <div className="col-span-1">Status</div>
                <div className="col-span-3">Actions</div>
              </div>
              {plans.map((plan, i) => (
                <AnimatedDiv key={plan.id} fade slideUp delay={i * 0.03} className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-[var(--border)] last:border-0 items-center hover:bg-[var(--bg-secondary)]/50 transition-colors">
                  <div className="col-span-2">
                    <p className="text-sm font-semibold text-[var(--text-primary)]">{plan.name}</p>
                    <p className="text-[10px] text-[var(--text-secondary)]">/{plan.slug}</p>
                  </div>
                  <div className="col-span-1 text-sm font-bold text-[var(--text-primary)]">{plan.price.toLocaleString("fr-FR")} F</div>
                  <div className="col-span-1 text-xs text-[var(--text-secondary)]">{plan.durationDays} jours</div>
                  <div className="col-span-3 flex flex-wrap gap-1">
                    {plan.hasPremiumBadge && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/15 text-amber-400">
                        <Crown className="w-3 h-3" /> Premium
                      </span>
                    )}
                    {plan.hasVerifiedBadge && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-green-500/15 text-green-400">
                        <BadgeCheck className="w-3 h-3" /> Vérifié
                      </span>
                    )}
                    {plan.hasFeaturedBadge && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/15 text-blue-400">
                        <Sparkles className="w-3 h-3" /> Featured
                      </span>
                    )}
                    {!plan.hasPremiumBadge && !plan.hasVerifiedBadge && !plan.hasFeaturedBadge && (
                      <span className="text-[10px] text-[var(--text-muted)]">Aucun</span>
                    )}
                  </div>
                  <div className="col-span-1 text-sm text-[var(--text-secondary)]">{plan.boostPrice.toLocaleString("fr-FR")} F</div>
                  <div className="col-span-1">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                      plan.isActive ? "text-green-400 bg-green-500/15" : "text-red-400 bg-red-500/15"
                    }`}>
                      {plan.isActive ? "Actif" : "Inactif"}
                    </span>
                  </div>
                  <div className="col-span-3 flex items-center gap-2">
                    <button onClick={() => openEditPlan(plan)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-[var(--text-link)] bg-[var(--text-link)]/10 hover:bg-[var(--text-link)]/20 transition-colors">
                      <Edit3 className="w-3 h-3" /> Modifier
                    </button>
                    <button onClick={() => setDeleteConfirm(plan)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-red-400 bg-red-500/10 hover:bg-red-500/20 transition-colors">
                      <Trash2 className="w-3 h-3" /> Supprimer
                    </button>
                  </div>
                </AnimatedDiv>
              ))}
            </div>
          )}
        </section>

        {/* Shops Section */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-[var(--text-primary)] flex items-center gap-2">
                <Store className="w-5 h-5 text-[var(--text-link)]" /> Boutiques
              </h2>
              <p className="text-xs text-[var(--text-secondary)]">{shops.length} boutiques inscrites</p>
            </div>
          </div>

          {loading ? (
            <p className="text-center text-[var(--text-secondary)] py-12">Chargement...</p>
          ) : shops.length === 0 ? (
            <div className="text-center py-12 bg-[var(--bg-primary)] rounded-2xl border-2 border-[var(--border)]">
              <Store className="w-12 h-12 text-[#1E293B] mx-auto mb-4" />
              <p className="text-[var(--text-secondary)]">Aucune boutique</p>
            </div>
          ) : (
            <div className="bg-[var(--bg-primary)] rounded-2xl border-2 border-[var(--border)] overflow-hidden">
              <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-[var(--bg-secondary)] border-b border-[var(--border)] text-xs font-semibold text-[var(--text-secondary)]">
                <div className="col-span-3">Boutique</div>
                <div className="col-span-2">Plan actuel</div>
                <div className="col-span-2">Statut</div>
                <div className="col-span-3">Badges</div>
                <div className="col-span-2">Actions</div>
              </div>
              {shops.map((shop, i) => {
                const sub = shop.subscription
                return (
                  <AnimatedDiv key={shop.id} fade slideUp delay={i * 0.02} className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-[var(--border)] last:border-0 items-center hover:bg-[var(--bg-secondary)]/50 transition-colors">
                    <div className="col-span-3 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[var(--text-link)]/10 flex items-center justify-center">
                        <Store className="w-4 h-4 text-[var(--text-link)]" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[var(--text-primary)]">{shop.name}</p>
                        <p className="text-[10px] text-[var(--text-secondary)]">{shop.ownerName}</p>
                      </div>
                    </div>
                    <div className="col-span-2 text-sm text-[var(--text-secondary)]">
                      {sub?.plan ? (
                        <span className="font-semibold text-[var(--text-primary)]">{sub.plan.name}</span>
                      ) : (
                        <span className="text-[var(--text-muted)]">Aucun</span>
                      )}
                    </div>
                    <div className="col-span-2">
                      {sub ? (
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          sub.status === "active"
                            ? "text-green-400 bg-green-500/15"
                            : "text-red-400 bg-red-500/15"
                        }`}>
                          {sub.status === "active" ? (
                            <><Check className="w-3 h-3" /> Actif</>
                          ) : (
                            <><Clock className="w-3 h-3" /> Expiré</>
                          )}
                        </span>
                      ) : (
                        <span className="text-[10px] text-[var(--text-muted)]">—</span>
                      )}
                    </div>
                    <div className="col-span-3 flex flex-wrap gap-1">
                      {sub?.badges?.map((b) => {
                        const badge = badgeIcons[b]
                        if (!badge) return null
                        const Icon = badge.icon
                        return (
                          <span key={b} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold" style={{ backgroundColor: `${badge.color}15`, color: badge.color }}>
                            <Icon className="w-3 h-3" /> {badge.label}
                          </span>
                        )
                      })}
                      {(!sub?.badges || sub.badges.length === 0) && (
                        <span className="text-[10px] text-[var(--text-muted)]">Aucun badge</span>
                      )}
                    </div>
                    <div className="col-span-2">
                      <button onClick={() => openPremiumModal(shop)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 transition-colors">
                        <Crown className="w-3 h-3" /> Activer Premium
                      </button>
                    </div>
                  </AnimatedDiv>
                )
              })}
            </div>
          )}
        </section>
      </div>

      {/* Plan Create/Edit Modal */}
      {planModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !saving && setPlanModal(false)} />
          <div className="relative bg-[var(--bg-primary)] border-2 border-[var(--border)] rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-[var(--text-primary)]">
                {editingPlan.id > 0 ? "Modifier le plan" : "Nouveau plan"}
              </h3>
              <button onClick={() => !saving && setPlanModal(false)} className="p-1 rounded-lg hover:bg-[var(--bg-secondary)] text-[var(--text-muted)]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">Nom</label>
                  <Input value={editingPlan.name} onChange={(e) => setEditingPlan({ ...editingPlan, name: e.target.value })} placeholder="Plan Premium" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">Slug</label>
                  <Input value={editingPlan.slug} onChange={(e) => setEditingPlan({ ...editingPlan, slug: e.target.value })} placeholder="premium" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">Description</label>
                <textarea value={editingPlan.description} onChange={(e) => setEditingPlan({ ...editingPlan, description: e.target.value })}
                  className="w-full rounded-2xl border-2 border-[var(--border)] bg-[var(--bg-primary)] px-4 py-3 text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] transition-all duration-300 focus:border-[var(--border-hover)] focus:outline-none focus:ring-4 focus:ring-[#1769F2]/10 hover:border-[var(--border-hover)]/30 resize-none text-sm"
                  rows={3} placeholder="Description du plan..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">Prix (F CFA)</label>
                  <Input type="number" value={editingPlan.price} onChange={(e) => setEditingPlan({ ...editingPlan, price: Number(e.target.value) })} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">Durée (jours)</label>
                  <Input type="number" value={editingPlan.durationDays} onChange={(e) => setEditingPlan({ ...editingPlan, durationDays: Number(e.target.value) })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">Boosts max</label>
                  <Input type="number" value={editingPlan.maxBoosts} onChange={(e) => setEditingPlan({ ...editingPlan, maxBoosts: Number(e.target.value) })} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">Prix du boost (F CFA)</label>
                  <Input type="number" value={editingPlan.boostPrice} onChange={(e) => setEditingPlan({ ...editingPlan, boostPrice: Number(e.target.value) })} />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-2">Badges inclus</label>
                <div className="space-y-2">
                  {[
                    { key: "hasPremiumBadge", label: "Premium", icon: Crown, color: "#D97706" },
                    { key: "hasVerifiedBadge", label: "Vérifié", icon: BadgeCheck, color: "#059669" },
                    { key: "hasFeaturedBadge", label: "Mis en avant", icon: Sparkles, color: "#1769F2" },
                  ].map((b) => {
                    const Icon = b.icon
                    const checked = editingPlan[b.key as keyof Plan] as boolean
                    return (
                      <label key={b.key} className="flex items-center gap-3 px-3 py-2 rounded-xl bg-[var(--bg-secondary)] cursor-pointer hover:bg-[var(--bg-elevated)] transition-colors">
                        <input type="checkbox" checked={checked}
                          onChange={(e) => setEditingPlan({ ...editingPlan, [b.key]: e.target.checked })}
                          className="w-4 h-4 rounded border-[var(--border)] text-[var(--text-link)] focus:ring-[var(--text-link)]" />
                        <Icon className="w-4 h-4" style={{ color: b.color }} />
                        <span className="text-sm text-[var(--text-primary)]">{b.label}</span>
                      </label>
                    )
                  })}
                </div>
              </div>

              <label className="flex items-center gap-3 px-3 py-2 rounded-xl bg-[var(--bg-secondary)] cursor-pointer hover:bg-[var(--bg-elevated)] transition-colors">
                <input type="checkbox" checked={editingPlan.isActive}
                  onChange={(e) => setEditingPlan({ ...editingPlan, isActive: e.target.checked })}
                  className="w-4 h-4 rounded border-[var(--border)] text-[var(--text-link)] focus:ring-[var(--text-link)]" />
                <span className="text-sm text-[var(--text-primary)]">Plan actif</span>
              </label>
            </div>

            <div className="flex items-center justify-end gap-3 mt-6 pt-6 border-t border-[var(--border)]">
              <Button variant="outline" size="sm" onClick={() => setPlanModal(false)} disabled={saving}>
                Annuler
              </Button>
              <Button size="sm" onClick={handleSavePlan} disabled={saving || !editingPlan.name || !editingPlan.slug}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {editingPlan.id > 0 ? "Enregistrer" : "Créer le plan"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !saving && setDeleteConfirm(null)} />
          <div className="relative bg-[var(--bg-primary)] border-2 border-[var(--border)] rounded-2xl w-full max-w-sm shadow-2xl p-6 text-center">
            <div className="w-12 h-12 rounded-xl bg-red-500/15 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-6 h-6 text-red-400" />
            </div>
            <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2">Supprimer le plan</h3>
            <p className="text-sm text-[var(--text-secondary)] mb-6">
              Êtes-vous sûr de vouloir supprimer <strong className="text-[var(--text-primary)]">{deleteConfirm.name}</strong> ? Cette action est irréversible.
            </p>
            <div className="flex items-center justify-center gap-3">
              <Button variant="outline" size="sm" onClick={() => setDeleteConfirm(null)} disabled={saving}>
                Annuler
              </Button>
              <Button size="sm" onClick={() => handleDeletePlan(deleteConfirm)} disabled={saving}
                className="bg-red-500 hover:bg-red-600 text-white">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Supprimer
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Premium Modal */}
      {premiumModal && premiumShop && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !saving && setPremiumModal(false)} />
          <div className="relative bg-[var(--bg-primary)] border-2 border-[var(--border)] rounded-2xl w-full max-w-md shadow-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Crown className="w-5 h-5 text-amber-400" />
                <h3 className="text-lg font-bold text-[var(--text-primary)]">Activer Premium</h3>
              </div>
              <button onClick={() => !saving && setPremiumModal(false)} className="p-1 rounded-lg hover:bg-[var(--bg-secondary)] text-[var(--text-muted)]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm text-[var(--text-secondary)] mb-6">
              Assigner un abonnement premium à <strong className="text-[var(--text-primary)]">{premiumShop.name}</strong>
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">Plan</label>
                <select value={premiumPlanId} onChange={(e) => setPremiumPlanId(e.target.value)}
                  className="w-full rounded-2xl border-2 border-[var(--border)] bg-[var(--bg-primary)] px-4 py-3 text-[var(--text-primary)] transition-all duration-300 focus:border-[var(--border-hover)] focus:outline-none focus:ring-4 focus:ring-[#1769F2]/10 hover:border-[var(--border-hover)]/30 text-sm">
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
                      <label key={b.key} className="flex items-center gap-3 px-3 py-2 rounded-xl bg-[var(--bg-secondary)] cursor-pointer hover:bg-[var(--bg-elevated)] transition-colors">
                        <input type="checkbox" checked={premiumBadges[b.key as keyof typeof premiumBadges]}
                          onChange={(e) => setPremiumBadges({ ...premiumBadges, [b.key]: e.target.checked })}
                          className="w-4 h-4 rounded border-[var(--border)] text-[var(--text-link)] focus:ring-[var(--text-link)]" />
                        <Icon className="w-4 h-4" style={{ color: b.color }} />
                        <span className="text-sm text-[var(--text-primary)]">{b.label}</span>
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
              <Button size="sm" onClick={handleAssignPremium} disabled={saving || !premiumPlanId}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Crown className="w-4 h-4" />}
                Activer Premium
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

"use client"

import { useState, useEffect, useCallback } from "react"
import {
  Gem, Check, X, Loader2, AlertTriangle, CheckCircle, CreditCard,
  RefreshCw, Calendar, Clock, Shield, Star, Zap, BadgeCheck
} from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import Button from "@/components/ui/button"
import { AnimatedDiv } from "@/lib/animations"

interface Plan {
  id: string
  name: string
  description: string
  price: number
  duration: number
  badgesIncluded: string[]
  boostsIncluded: number
  features: string[]
}

interface Subscription {
  id: string
  planId: string
  planName: string
  planDescription: string
  price: number
  startDate: string
  endDate: string
  status: "active" | "expired"
  autoRenew: boolean
  badgesIncluded: string[]
  boostsIncluded: number
  boostsUsed: number
}

const badgeIcons: Record<string, React.ElementType> = {
  Premium: Gem,
  Vérifié: BadgeCheck,
  "Mis en avant": Star,
}

const badgeColors: Record<string, string> = {
  Premium: "bg-purple-100 text-purple-700 border-purple-200",
  Vérifié: "bg-blue-100 text-blue-700 border-blue-200",
  "Mis en avant": "bg-amber-100 text-amber-700 border-amber-200",
}

const defaultPlans: Plan[] = [
  { id: "free", name: "Gratuit", description: "Pour démarrer", price: 0, duration: 30, badgesIncluded: [], boostsIncluded: 0, features: ["Visibilité de base", "Pas de commission"] },
  { id: "basic", name: "Basic", description: "Pour les petits vendeurs", price: 5000, duration: 30, badgesIncluded: ["Vérifié"], boostsIncluded: 2, features: ["Badge Vérifié", "2 boosts/mois", "Support prioritaire"] },
  { id: "pro", name: "Pro", description: "Pour les vendeurs actifs", price: 15000, duration: 30, badgesIncluded: ["Premium", "Vérifié"], boostsIncluded: 10, features: ["Badge Premium", "Badge Vérifié", "10 boosts/mois", "Support dédié", "Statistiques avancées"] },
  { id: "enterprise", name: "Enterprise", description: "Pour les grandes boutiques", price: 50000, duration: 30, badgesIncluded: ["Premium", "Vérifié", "Mis en avant"], boostsIncluded: 30, features: ["Tous les badges", "30 boosts/mois", "Support VIP", "Mise en avant catalogue", "API dédiée", "Rapports personnalisés"] },
]

export default function AbonnementPage() {
  const { user, getAuthHeaders } = useAuth()
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [plans, setPlans] = useState<Plan[]>(defaultPlans)
  const [loading, setLoading] = useState(true)
  const [plansLoading, setPlansLoading] = useState(true)
  const [subscribing, setSubscribing] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [showConfirm, setShowConfirm] = useState<string | null>(null)
  const [showPayment, setShowPayment] = useState<string | null>(null)
  const [paymentLoading, setPaymentLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [autoRenew, setAutoRenew] = useState(true)

  const fetchSubscription = useCallback(async () => {
    if (!user) return
    try {
      const res = await fetch("/api/shops/subscription", { headers: getAuthHeaders() })
      if (res.ok) {
        const data = await res.json()
        setSubscription(data.subscription)
        setAutoRenew(data.subscription?.autoRenew ?? true)
      }
    } catch (err) {
      console.error("Erreur chargement abonnement:", err)
    } finally {
      setLoading(false)
    }
  }, [user, getAuthHeaders])

  const fetchPlans = useCallback(async () => {
    try {
      const res = await fetch("/api/plans")
      if (res.ok) {
        const data = await res.json()
        if (Array.isArray(data) && data.length > 0) setPlans(data)
      }
    } catch {
      // Use default plans
    } finally {
      setPlansLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSubscription()
    fetchPlans()
  }, [fetchSubscription, fetchPlans])

  const formatCurrency = (amount: number) => `${amount.toLocaleString("fr-FR")} F CFA`

  const isExpired = subscription?.status === "expired" || (subscription && new Date(subscription.endDate) < new Date())

  const handleSubscribe = async (planId: string) => {
    const plan = plans.find(p => p.id === planId)
    if (!plan) return

    if (plan.price > 0) {
      setShowConfirm(null)
      setShowPayment(planId)
      return
    }

    setSubscribing(true)
    setError("")
    setSuccess("")
    try {
      const res = await fetch("/api/shops/subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({ planId, autoRenew }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Erreur lors de l'abonnement")
      setSubscription(data.subscription)
      setSuccess("Abonnement activé avec succès")
      setTimeout(() => setSuccess(""), 4000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSubscribing(false)
    }
  }

  const handlePayment = async (planId: string) => {
    setPaymentLoading(true)
    setError("")
    setSuccess("")
    try {
      const initRes = await fetch("/api/payments/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({ planId, type: "subscription" }),
      })
      const initData = await initRes.json()
      if (!initRes.ok) throw new Error(initData.error || "Erreur d'initiation du paiement")

      const confirmRes = await fetch("/api/payments/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({ paymentId: initData.paymentId, planId, type: "subscription" }),
      })
      const confirmData = await confirmRes.json()
      if (!confirmRes.ok) throw new Error(confirmData.error || "Erreur de confirmation du paiement")

      fetchSubscription()
      setShowPayment(null)
      setSuccess("Paiement confirmé et abonnement activé avec succès")
      setTimeout(() => setSuccess(""), 4000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setPaymentLoading(false)
    }
  }

  const handleCancel = async () => {
    setCancelling(true)
    setError("")
    setSuccess("")
    try {
      const res = await fetch("/api/shops/subscription", {
        method: "DELETE",
        headers: getAuthHeaders(),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Erreur lors de la résiliation")
      }
      setSubscription(null)
      setSuccess("Abonnement résilié avec succès")
      setTimeout(() => setSuccess(""), 4000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setCancelling(false)
    }
  }

  const handleToggleAutoRenew = async () => {
    const newValue = !autoRenew
    setAutoRenew(newValue)
    try {
      await fetch("/api/shops/subscription", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({ autoRenew: newValue }),
      })
    } catch {
      setAutoRenew(!newValue)
    }
  }

  const getStatusBadge = () => {
    if (isExpired) return { label: "Expiré", color: "bg-red-100 text-red-700 border-red-200" }
    return { label: "Actif", color: "bg-green-100 text-green-700 border-green-200" }
  }

  const daysRemaining = subscription
    ? Math.max(0, Math.ceil((new Date(subscription.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0

  if (loading || plansLoading) {
    return (
      <div className="w-full min-h-screen bg-[var(--bg-secondary)] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--text-link)]" />
      </div>
    )
  }

  return (
    <div className="w-full min-h-screen bg-[var(--bg-secondary)]">
      <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-[var(--text-primary)]">Mon Abonnement</h1>
            <p className="text-[var(--text-secondary)]">Gérez votre formule d'abonnement et profitez des avantages</p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-red-50 border-2 border-red-200 flex items-center gap-3 text-red-700 text-sm font-medium">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 rounded-2xl bg-green-50 border-2 border-green-200 flex items-center gap-3 text-green-700 text-sm font-medium">
            <CheckCircle className="w-5 h-5 shrink-0" />
            {success}
          </div>
        )}

        {subscription && !isExpired ? (
          <AnimatedDiv fade slideUp className="mb-8">
            <div className="bg-[var(--bg-primary)] rounded-2xl border-2 border-[var(--border)] overflow-hidden">
              <div className="h-2 bg-gradient-to-r from-[var(--text-link)] to-purple-500" />
              <div className="p-6 sm:p-8">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-[var(--text-link)]/10 flex items-center justify-center">
                      <Gem className="w-7 h-7 text-[var(--text-link)]" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-[var(--text-primary)]">{subscription.planName}</h2>
                      <p className="text-sm text-[var(--text-secondary)]">{subscription.planDescription}</p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold border-2 ${getStatusBadge().color}`}>
                    {getStatusBadge().label}
                  </span>
                </div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  <div className="p-4 rounded-xl bg-[var(--bg-secondary)]">
                    <p className="text-xs text-[var(--text-secondary)] mb-1">Prix</p>
                    <p className="text-lg font-bold text-[var(--text-primary)]">{formatCurrency(subscription.price)}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-[var(--bg-secondary)]">
                    <p className="text-xs text-[var(--text-secondary)] mb-1">Début</p>
                    <p className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-[var(--text-link)]" />
                      {new Date(subscription.startDate).toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-[var(--bg-secondary)]">
                    <p className="text-xs text-[var(--text-secondary)] mb-1">Fin</p>
                    <p className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-[var(--text-link)]" />
                      {new Date(subscription.endDate).toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-[var(--bg-secondary)]">
                    <p className="text-xs text-[var(--text-secondary)] mb-1">Jours restants</p>
                    <p className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-[var(--text-link)]" />
                      {daysRemaining} jours
                    </p>
                  </div>
                </div>

                {subscription.badgesIncluded && subscription.badgesIncluded.length > 0 && (
                  <div className="mb-6">
                    <p className="text-sm font-semibold text-[var(--text-primary)] mb-3">Badges inclus</p>
                    <div className="flex flex-wrap gap-2">
                      {subscription.badgesIncluded.map(badge => {
                        const Icon = badgeIcons[badge] || Shield
                        const color = badgeColors[badge] || "bg-gray-100 text-gray-700 border-gray-200"
                        return (
                          <span key={badge} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border-2 ${color}`}>
                            <Icon className="w-3.5 h-3.5" />
                            {badge}
                          </span>
                        )
                      })}
                    </div>
                  </div>
                )}

                <div className="mb-6">
                  <p className="text-sm font-semibold text-[var(--text-primary)] mb-3">Boosts</p>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 bg-[var(--bg-secondary)] rounded-full h-3 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[var(--text-link)] to-purple-500 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, (subscription.boostsUsed / subscription.boostsIncluded) * 100)}%` }}
                      />
                    </div>
                    <span className="text-sm font-semibold text-[var(--text-primary)] shrink-0">
                      {subscription.boostsUsed} utilisés sur {subscription.boostsIncluded}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-4 pt-6 border-t-2 border-[var(--border)]">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={autoRenew}
                      onChange={handleToggleAutoRenew}
                      className="w-4 h-4 text-[var(--text-link)] rounded"
                    />
                    <span className="text-sm text-[var(--text-primary)]">
                      <RefreshCw className="w-3.5 h-3.5 inline mr-1" />
                      Renouvellement automatique
                    </span>
                  </label>
                  <Button variant="outline" onClick={handleCancel} disabled={cancelling} className="ml-auto text-red-500 border-red-200 hover:border-red-300 hover:text-red-600">
                    {cancelling ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    Résilier
                  </Button>
                </div>
              </div>
            </div>
          </AnimatedDiv>
        ) : (
          <AnimatedDiv fade slideUp className="mb-8">
            <div className="bg-[var(--bg-primary)] rounded-2xl border-2 border-[var(--border)] p-8 text-center">
              <div className="w-16 h-16 rounded-2xl bg-[var(--text-link)]/10 flex items-center justify-center mx-auto mb-4">
                <Gem className="w-8 h-8 text-[var(--text-link)]" />
              </div>
              <h2 className="text-xl font-bold text-[var(--text-primary)] mb-2">Aucun abonnement actif</h2>
              <p className="text-[var(--text-secondary)] mb-6">
                Souscrivez à une formule pour bénéficier de badges, boosts et avantages exclusifs.
              </p>
            </div>
          </AnimatedDiv>
        )}

        <AnimatedDiv fade slideUp delay={0.1}>
          <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-6">Formules disponibles</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {plans.map((plan, i) => {
              const isCurrent = subscription?.planId === plan.id && !isExpired
              return (
                <AnimatedDiv key={plan.id} fade slideUp delay={0.05 * i} className={`bg-[var(--bg-primary)] rounded-2xl border-2 p-6 flex flex-col transition-all ${
                  isCurrent ? "border-[var(--text-link)] shadow-lg shadow-blue-200/50" : "border-[var(--border)] hover:border-[var(--border-hover)]"
                }`}>
                  {isCurrent && (
                    <span className="self-start px-3 py-1 mb-3 rounded-full bg-[var(--text-link)]/10 text-[var(--text-link)] text-xs font-semibold">Actuel</span>
                  )}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-[var(--text-link)]/10 flex items-center justify-center">
                      <Gem className="w-5 h-5 text-[var(--text-link)]" />
                    </div>
                    <div>
                      <h3 className="font-bold text-[var(--text-primary)]">{plan.name}</h3>
                      <p className="text-xs text-[var(--text-secondary)]">{plan.description}</p>
                    </div>
                  </div>

                  <div className="mb-4">
                    <p className="text-2xl font-bold text-[var(--text-primary)]">
                      {plan.price === 0 ? "Gratuit" : formatCurrency(plan.price)}
                    </p>
                    <p className="text-xs text-[var(--text-secondary)]">par {plan.duration} jours</p>
                  </div>

                  <ul className="space-y-2 mb-6 flex-1">
                    {plan.features.map((f, fi) => (
                      <li key={fi} className="flex items-start gap-2 text-sm text-[var(--text-primary)]">
                        <Check className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                        {f}
                      </li>
                    ))}
                    {plan.badgesIncluded.length > 0 && (
                      <li className="flex items-start gap-2 text-sm text-[var(--text-primary)]">
                        <Check className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                        Badges : {plan.badgesIncluded.join(", ")}
                      </li>
                    )}
                    {plan.boostsIncluded > 0 && (
                      <li className="flex items-start gap-2 text-sm text-[var(--text-primary)]">
                        <Check className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                        {plan.boostsIncluded} boost{plan.boostsIncluded > 1 ? "s" : ""} inclus
                      </li>
                    )}
                  </ul>

                  <Button
                    onClick={() => setShowConfirm(plan.id)}
                    disabled={isCurrent || subscribing}
                    fullWidth
                    variant={isCurrent ? "outline" : "primary"}
                  >
                    {isCurrent ? "Formule actuelle" : subscribing && showConfirm === plan.id ? <Loader2 className="w-4 h-4 animate-spin" /> : "Souscrire"}
                  </Button>
                </AnimatedDiv>
              )
            })}
          </div>
        </AnimatedDiv>

        {showConfirm && (() => {
          const plan = plans.find(p => p.id === showConfirm)
          if (!plan) return null
          return (
            <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
              <AnimatedDiv fade slideUp className="bg-[var(--bg-primary)] rounded-2xl p-6 max-w-sm w-full shadow-2xl">
                <div className="w-12 h-12 rounded-2xl bg-[var(--text-link)]/10 flex items-center justify-center mx-auto mb-4">
                  <Gem className="w-6 h-6 text-[var(--text-link)]" />
                </div>
                <h3 className="text-lg font-bold text-[var(--text-primary)] text-center mb-2">Confirmer l'abonnement</h3>
                <p className="text-sm text-[var(--text-secondary)] text-center mb-6">
                  Vous allez souscrire à la formule <strong>{plan.name}</strong>
                  {plan.price > 0 ? ` pour ${formatCurrency(plan.price)}` : " gratuite"}.
                </p>
                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1" onClick={() => setShowConfirm(null)}>Annuler</Button>
                  <Button className="flex-1" onClick={() => handleSubscribe(plan.id)} disabled={subscribing}>
                    {subscribing ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirmer"}
                  </Button>
                </div>
              </AnimatedDiv>
            </div>
          )
        })()}

        {showPayment && (() => {
          const plan = plans.find(p => p.id === showPayment)
          if (!plan) return null
          return (
            <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
              <AnimatedDiv fade slideUp className="bg-[var(--bg-primary)] rounded-2xl p-6 max-w-sm w-full shadow-2xl">
                <div className="w-12 h-12 rounded-2xl bg-green-100 flex items-center justify-center mx-auto mb-4">
                  <CreditCard className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="text-lg font-bold text-[var(--text-primary)] text-center mb-2">Paiement</h3>
                <p className="text-sm text-[var(--text-secondary)] text-center mb-2">
                  Formule <strong>{plan.name}</strong>
                </p>
                <p className="text-3xl font-bold text-[var(--text-primary)] text-center mb-6">
                  {formatCurrency(plan.price)}
                </p>
                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1" onClick={() => setShowPayment(null)}>Annuler</Button>
                  <Button className="flex-1" onClick={() => handlePayment(plan.id)} disabled={paymentLoading}>
                    {paymentLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
                    {paymentLoading ? "Paiement..." : "Confirmer le paiement"}
                  </Button>
                </div>
              </AnimatedDiv>
            </div>
          )
        })()}
      </div>
    </div>
  )
}

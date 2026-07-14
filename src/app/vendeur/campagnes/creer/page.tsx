"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  Megaphone, ArrowLeft, Loader2, AlertTriangle, CheckCircle,
  Zap, Sparkles, Info, Euro
} from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import Button from "@/components/ui/button"
import Input from "@/components/ui/input"
import { AnimatedDiv } from "@/lib/animations"
import Link from "next/link"
import {
  CAMPAIGN_TYPE_LABELS, AD_SLOT_LABELS, BOOSTER_EXPRESS_OPTIONS,
  type CampaignType, type AdSlot
} from "@/lib/ads"

export default function CreateCampaignPage() {
  const router = useRouter()
  const { user, getAuthHeaders } = useAuth()
  const [mode, setMode] = useState<"booster" | "advanced">("booster")
  const [shops, setShops] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [aiRecommendation, setAiRecommendation] = useState<any>(null)
  const [aiLoading, setAiLoading] = useState(false)

  const [form, setForm] = useState({
    name: "",
    shopId: "",
    type: "sponsored_product" as CampaignType,
    objective: "visibility",
    budget: 5000,
    dailyBudget: 500,
    startDate: new Date().toISOString().split("T")[0],
    endDate: new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0],
    targetCountry: "",
    targetCity: "",
    targetCategory: "",
    productId: "",
    bannerImage: "",
    bannerUrl: "",
    placements: [] as string[],
    durationDays: 7,
  })

  useEffect(() => {
    if (!user) return
    Promise.all([
      fetch("/api/shops", { headers: getAuthHeaders() }).then(r => r.json()),
      fetch(`/api/products?sellerId=${user.id}&organic=false`, { headers: getAuthHeaders() }).then(r => r.json()),
    ]).then(([shopsData, productsData]) => {
      const shopsList = Array.isArray(shopsData) ? shopsData : (shopsData.shops || [])
      const productsList = Array.isArray(productsData) ? productsData : (productsData.products || [])
      setShops(shopsList)
      setProducts(productsList)
      if (shopsList.length > 0) {
        setForm(prev => ({ ...prev, shopId: shopsList[0].id }))
      }
    }).finally(() => setLoading(false))
  }, [user, getAuthHeaders])

  const getAiRecommendation = async () => {
    setAiLoading(true)
    try {
      const params = new URLSearchParams({
        type: form.type,
        budget: String(form.budget),
        category: form.targetCategory || "",
      })
      const res = await fetch(`/api/ads/ai?${params}`, { headers: getAuthHeaders() })
      if (res.ok) {
        const data = await res.json()
        setAiRecommendation(data)
      }
    } catch {}
    setAiLoading(false)
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    setError("")
    setSuccess("")

    try {
      if (mode === "booster") {
        if (!form.productId) {
          throw new Error("Veuillez sélectionner un produit")
        }
        const res = await fetch("/api/ads/booster", {
          method: "POST",
          headers: { "Content-Type": "application/json", ...getAuthHeaders() },
          body: JSON.stringify({
            productId: Number(form.productId),
            durationDays: form.durationDays,
            paymentMethod: "orange_money",
          }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || "Erreur")
        setSuccess("Campagne Booster Express créée avec succès !")
        setTimeout(() => router.push("/vendeur/campagnes"), 1500)
      } else {
        if (!form.name || !form.shopId || !form.startDate || !form.endDate) {
          throw new Error("Veuillez remplir tous les champs obligatoires")
        }
        const placements = form.placements.map(id => ({ id, bid: 0 }))
        const res = await fetch("/api/ads", {
          method: "POST",
          headers: { "Content-Type": "application/json", ...getAuthHeaders() },
          body: JSON.stringify({
            shopId: form.shopId,
            name: form.name,
            type: form.type,
            objective: form.objective,
            budget: form.budget,
            startDate: form.startDate,
            endDate: form.endDate,
            dailyBudget: form.dailyBudget,
            targetCountry: form.targetCountry || null,
            targetCity: form.targetCity || null,
            targetCategory: form.targetCategory || null,
            productId: form.productId ? Number(form.productId) : null,
            bannerImage: form.bannerImage || null,
            bannerUrl: form.bannerUrl || null,
            placements,
            isBooster: false,
          }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || "Erreur")
        setSuccess("Campagne créée avec succès ! En attente de validation.")
        setTimeout(() => router.push("/vendeur/campagnes"), 1500)
      }
    } catch (err: any) {
      setError(err.message)
    }
    setSubmitting(false)
  }

  const allPlacementSlots: AdSlot[] = [
    "HOME_HERO", "HOME_FEATURED", "HOME_INLINE",
    "SEARCH_TOP", "SEARCH_INLINE", "SEARCH_BOTTOM",
    "CATEGORY_TOP", "CATEGORY_INLINE", "CATEGORY_BOTTOM",
    "PRODUCT_SIMILAR", "PRODUCT_SELLER", "PRODUCT_RECOMMENDED",
    "SHOP_TOP", "SHOP_PRODUCTS",
    "MOBILE_FEED", "MOBILE_CAROUSEL", "MOBILE_BANNER",
  ]

  const selectedOption = BOOSTER_EXPRESS_OPTIONS.find(o => o.days === form.durationDays) || BOOSTER_EXPRESS_OPTIONS[2]

  if (loading) {
    return (
      <div className="w-full min-h-screen bg-[var(--bg-secondary)] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--text-link)]" />
      </div>
    )
  }

  return (
    <div className="w-full min-h-screen bg-[var(--bg-secondary)]">
      <div className="w-full max-w-[900px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center gap-3 mb-8">
          <Link href="/vendeur/campagnes">
            <button className="p-2 rounded-xl hover:bg-[var(--bg-primary)] text-[var(--text-secondary)] transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-[var(--text-primary)]">Nouvelle campagne</h1>
            <p className="text-[var(--text-secondary)]">Créez une campagne publicitaire Axel Ads</p>
          </div>
        </div>

        <div className="flex gap-3 mb-8">
          <button
            onClick={() => setMode("booster")}
            className={`flex-1 p-4 rounded-2xl border-2 text-left transition-all ${
              mode === "booster"
                ? "border-amber-500 bg-amber-50"
                : "border-[var(--border)] bg-[var(--bg-primary)] hover:border-amber-300"
            }`}
          >
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center mb-3">
              <Zap className="w-5 h-5 text-amber-600" />
            </div>
            <p className="font-bold text-[var(--text-primary)]">Booster Express</p>
            <p className="text-xs text-[var(--text-secondary)]">Simple et rapide, idéal pour débuter</p>
          </button>
          <button
            onClick={() => setMode("advanced")}
            className={`flex-1 p-4 rounded-2xl border-2 text-left transition-all ${
              mode === "advanced"
                ? "border-[var(--text-link)] bg-blue-50"
                : "border-[var(--border)] bg-[var(--bg-primary)] hover:border-[var(--text-link)]/30"
            }`}
          >
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center mb-3">
              <Sparkles className="w-5 h-5 text-blue-600" />
            </div>
            <p className="font-bold text-[var(--text-primary)]">Campagne Avancée</p>
            <p className="text-xs text-[var(--text-secondary)]">Contrôle total : budget, ciblage, emplacements</p>
          </button>
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

        <div className="space-y-6">
          {mode === "booster" ? (
            <AnimatedDiv key="booster" fade slideUp>
              <div className="bg-[var(--bg-primary)] rounded-2xl border-2 border-[var(--border)] p-6 space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center">
                    <Zap className="w-6 h-6 text-amber-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-[var(--text-primary)]">Booster Express</h2>
                    <p className="text-sm text-[var(--text-secondary)]">Mettez un produit en avant instantanément</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[var(--text-primary)] mb-2">Produit à booster</label>
                  <select
                    value={form.productId}
                    onChange={e => setForm(prev => ({ ...prev, productId: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl bg-[var(--bg-secondary)] border-2 border-[var(--border)] text-sm text-[var(--text-primary)]"
                  >
                    <option value="">Sélectionnez un produit</option>
                    {products.map((p: any) => (
                      <option key={p.id} value={p.id}>{p.name} - {Number(p.price).toLocaleString("fr-FR")} F</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[var(--text-primary)] mb-2">Durée</label>
                  <div className="flex gap-2 flex-wrap">
                    {BOOSTER_EXPRESS_OPTIONS.map(opt => (
                      <button
                        key={opt.days}
                        type="button"
                        onClick={() => setForm(prev => ({ ...prev, durationDays: opt.days }))}
                        className={`px-5 py-3 rounded-xl text-sm font-semibold border-2 transition-all ${
                          form.durationDays === opt.days
                            ? "border-amber-500 bg-amber-50 text-amber-700"
                            : "border-[var(--border)] text-[var(--text-secondary)] hover:border-amber-300"
                        }`}
                      >
                        <p>{opt.label}</p>
                        <p className="text-xs font-normal text-[var(--text-muted)]">{opt.price.toLocaleString("fr-FR")} F</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-amber-700 font-medium">Total à payer</p>
                      <p className="text-2xl font-black text-amber-700">{selectedOption.price.toLocaleString("fr-FR")} F</p>
                    </div>
                    <Info className="w-8 h-8 text-amber-400" />
                  </div>
                  <p className="text-xs text-amber-600/70 mt-2">
                    Diffusion automatique sur l&apos;accueil, la recherche et la catégorie du produit.
                  </p>
                </div>
              </div>
            </AnimatedDiv>
          ) : (
            <AnimatedDiv key="advanced" fade slideUp>
              <div className="bg-[var(--bg-primary)] rounded-2xl border-2 border-[var(--border)] p-6 space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-blue-100 flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-[var(--text-primary)]">Campagne Avancée</h2>
                    <p className="text-sm text-[var(--text-secondary)]">Configuration complète</p>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-[var(--text-primary)] mb-2">Nom de la campagne *</label>
                    <Input
                      placeholder="Ex: Promotion été 2026"
                      value={form.name}
                      onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-[var(--text-primary)] mb-2">Boutique *</label>
                    <select
                      value={form.shopId}
                      onChange={e => setForm(prev => ({ ...prev, shopId: e.target.value }))}
                      className="w-full px-4 py-3 rounded-xl bg-[var(--bg-secondary)] border-2 border-[var(--border)] text-sm text-[var(--text-primary)]"
                    >
                      {shops.map((s: any) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-[var(--text-primary)] mb-2">Type de campagne *</label>
                    <select
                      value={form.type}
                      onChange={e => setForm(prev => ({ ...prev, type: e.target.value as CampaignType }))}
                      className="w-full px-4 py-3 rounded-xl bg-[var(--bg-secondary)] border-2 border-[var(--border)] text-sm text-[var(--text-primary)]"
                    >
                      {Object.entries(CAMPAIGN_TYPE_LABELS).map(([k, v]) => (
                        <option key={k} value={k}>{v}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-[var(--text-primary)] mb-2">Objectif</label>
                    <select
                      value={form.objective}
                      onChange={e => setForm(prev => ({ ...prev, objective: e.target.value }))}
                      className="w-full px-4 py-3 rounded-xl bg-[var(--bg-secondary)] border-2 border-[var(--border)] text-sm text-[var(--text-primary)]"
                    >
                      <option value="visibility">Visibilité</option>
                      <option value="traffic">Trafic</option>
                      <option value="conversions">Conversions</option>
                      <option value="sales">Ventes</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-[var(--text-primary)] mb-2">Budget total (F)</label>
                    <Input
                      type="number"
                      min={1000}
                      value={form.budget}
                      onChange={e => setForm(prev => ({ ...prev, budget: Number(e.target.value) }))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-[var(--text-primary)] mb-2">Budget journalier (F)</label>
                    <Input
                      type="number"
                      min={100}
                      value={form.dailyBudget}
                      onChange={e => setForm(prev => ({ ...prev, dailyBudget: Number(e.target.value) }))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-[var(--text-primary)] mb-2">Date de début *</label>
                    <Input
                      type="date"
                      value={form.startDate}
                      onChange={e => setForm(prev => ({ ...prev, startDate: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-[var(--text-primary)] mb-2">Date de fin *</label>
                    <Input
                      type="date"
                      value={form.endDate}
                      onChange={e => setForm(prev => ({ ...prev, endDate: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-[var(--text-primary)] mb-2">Cible - Pays</label>
                    <Input
                      placeholder="Tous les pays"
                      value={form.targetCountry}
                      onChange={e => setForm(prev => ({ ...prev, targetCountry: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-[var(--text-primary)] mb-2">Cible - Ville</label>
                    <Input
                      placeholder="Toutes les villes"
                      value={form.targetCity}
                      onChange={e => setForm(prev => ({ ...prev, targetCity: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-[var(--text-primary)] mb-2">Cible - Catégorie</label>
                    <Input
                      placeholder="Toutes les catégories"
                      value={form.targetCategory}
                      onChange={e => setForm(prev => ({ ...prev, targetCategory: e.target.value }))}
                    />
                  </div>
                  {form.type === "sponsored_product" && (
                    <div>
                      <label className="block text-sm font-semibold text-[var(--text-primary)] mb-2">Produit à promouvoir</label>
                      <select
                        value={form.productId}
                        onChange={e => setForm(prev => ({ ...prev, productId: e.target.value }))}
                        className="w-full px-4 py-3 rounded-xl bg-[var(--bg-secondary)] border-2 border-[var(--border)] text-sm text-[var(--text-primary)]"
                      >
                        <option value="">Sélectionnez un produit</option>
                        {products.map((p: any) => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[var(--text-primary)] mb-3">Emplacements sponsorisés</label>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {allPlacementSlots.map(slot => (
                      <label
                        key={slot}
                        className={`flex items-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                          form.placements.includes(slot)
                            ? "border-[var(--text-link)] bg-blue-50"
                            : "border-[var(--border)] hover:border-[var(--text-link)]/30"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={form.placements.includes(slot)}
                          onChange={() => {
                            setForm(prev => ({
                              ...prev,
                              placements: prev.placements.includes(slot)
                                ? prev.placements.filter(p => p !== slot)
                                : [...prev.placements, slot],
                            }))
                          }}
                          className="sr-only"
                        />
                        <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                          form.placements.includes(slot) ? "bg-[var(--text-link)] border-[var(--text-link)]" : "border-[var(--border)]"
                        }`}>
                          {form.placements.includes(slot) && <CheckCircle className="w-3 h-3 text-white" />}
                        </div>
                        <span className="text-xs text-[var(--text-primary)]">{AD_SLOT_LABELS[slot] || slot}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex justify-center">
                  <Button variant="outline" onClick={getAiRecommendation} disabled={aiLoading}>
                    {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    Recommandations IA
                  </Button>
                </div>

                {aiRecommendation && (
                  <div className="p-4 rounded-xl bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-200 space-y-3">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-purple-600" />
                      <p className="font-bold text-purple-700">Recommandations IA</p>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-purple-600 font-semibold">Budget recommandé</p>
                        <p className="text-purple-900">
                          Optimal: {aiRecommendation.recommendedBudget.optimal.toLocaleString("fr-FR")} F
                          <span className="text-purple-500 text-xs"> ({aiRecommendation.recommendedBudget.min.toLocaleString("fr-FR")} - {aiRecommendation.recommendedBudget.max.toLocaleString("fr-FR")} F)</span>
                        </p>
                      </div>
                      <div>
                        <p className="text-purple-600 font-semibold">Performance estimée</p>
                        <p className="text-purple-900">
                          ~{aiRecommendation.predictedPerformance.estimatedImpressions.toLocaleString("fr-FR")} impressions · {aiRecommendation.predictedPerformance.estimatedClicks} clics
                        </p>
                      </div>
                      <div>
                        <p className="text-purple-600 font-semibold">Meilleurs emplacements</p>
                        {aiRecommendation.recommendedPlacements.slice(0, 3).map((p: any) => (
                          <p key={p.slot} className="text-purple-900 text-xs">{AD_SLOT_LABELS[p.slot] || p.slot} (score: {p.score})</p>
                        ))}
                      </div>
                      <div>
                        <p className="text-purple-600 font-semibold">Meilleures heures</p>
                        <p className="text-purple-900">{aiRecommendation.bestHours.join(", ")}</p>
                      </div>
                    </div>
                    <p className="text-xs text-purple-500">Confiance: {(aiRecommendation.confidence * 100).toFixed(0)}%</p>
                  </div>
                )}
              </div>
            </AnimatedDiv>
          )}

          <div className="flex gap-3 justify-end">
            <Link href="/vendeur/campagnes">
              <Button variant="outline">Annuler</Button>
            </Link>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : mode === "booster" ? <Zap className="w-4 h-4" /> : <Megaphone className="w-4 h-4" />}
              {submitting ? "Création..." : mode === "booster" ? "Lancer le Boost" : "Créer la campagne"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

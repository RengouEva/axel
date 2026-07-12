"use client"

import { useState, useEffect, useCallback } from "react"
import {
  Zap, Search, ChevronLeft, ChevronRight, Loader2, AlertTriangle,
  CheckCircle, CreditCard, Clock, Calendar, ArrowUp, X
} from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import Button from "@/components/ui/button"
import Input from "@/components/ui/input"
import { AnimatedDiv } from "@/lib/animations"

interface Product {
  id: number
  name: string
  image: string
  price: number
  brand: string
  category: string
}

interface Boost {
  id: string
  productId: number
  productName: string
  productImage: string
  startDate: string
  endDate: string
  status: "active" | "completed"
}

interface BoostOption {
  days: number
  price: number
}

const ITEMS_PER_PAGE = 12
const DEFAULT_BOOST_OPTIONS: BoostOption[] = [
  { days: 7, price: 2000 },
  { days: 15, price: 3500 },
  { days: 30, price: 5000 },
]

export default function BoostPage() {
  const { user, getAuthHeaders } = useAuth()
  const [boosts, setBoosts] = useState<Boost[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [productsLoading, setProductsLoading] = useState(true)
  const [boostingId, setBoostingId] = useState<number | null>(null)
  const [showPayment, setShowPayment] = useState<number | null>(null)
  const [paymentLoading, setPaymentLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [boostOptions, setBoostOptions] = useState<BoostOption[]>(DEFAULT_BOOST_OPTIONS)
  const [selectedDuration, setSelectedDuration] = useState(30)
  const [freeBoostsRemaining, setFreeBoostsRemaining] = useState(0)
  const [boostsIncluded, setBoostsIncluded] = useState(0)

  const fetchBoosts = useCallback(async () => {
    if (!user) return
    try {
      const res = await fetch("/api/products/boost", { headers: getAuthHeaders() })
      if (res.ok) {
        const data = await res.json()
        setBoosts(Array.isArray(data) ? data : data.boosts || [])
        setFreeBoostsRemaining(data.freeBoostsRemaining ?? 0)
        setBoostsIncluded(data.boostsIncluded ?? 0)
        if (data.boostOptions) setBoostOptions(data.boostOptions)
      }
    } catch (err) {
      console.error("Erreur chargement boosts:", err)
    } finally {
      setLoading(false)
    }
  }, [user, getAuthHeaders])

  const fetchProducts = useCallback(async () => {
    if (!user) return
    try {
      const res = await fetch(`/api/products?sellerId=${user.id}`, { headers: getAuthHeaders() })
      if (res.ok) {
        const data = await res.json()
        setProducts(Array.isArray(data) ? data : data.products || [])
      }
    } catch (err) {
      console.error("Erreur chargement produits:", err)
    } finally {
      setProductsLoading(false)
    }
  }, [user, getAuthHeaders])

  useEffect(() => {
    fetchBoosts()
    fetchProducts()
  }, [fetchBoosts, fetchProducts])

  const boostedProductIds = new Set(boosts.filter(b => b.status === "active").map(b => b.productId))

  const formatCurrency = (amount: number) => `${amount.toLocaleString("fr-FR")} F`

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.brand.toLowerCase().includes(search.toLowerCase())
  )

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / ITEMS_PER_PAGE))
  const paginatedProducts = filteredProducts.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE)

  const handleBoost = async (productId: number) => {
    const product = products.find(p => p.id === productId)
    if (!product) return

    if (freeBoostsRemaining > 0) {
      setBoostingId(productId)
      setError("")
      setSuccess("")
      try {
        const res = await fetch("/api/products/boost", {
          method: "POST",
          headers: { "Content-Type": "application/json", ...getAuthHeaders() },
          body: JSON.stringify({ productId, free: true, durationDays: selectedDuration }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || "Erreur lors du boost")
        setBoosts(prev => [...prev, data.boost || data])
        setFreeBoostsRemaining(prev => Math.max(0, prev - 1))
        setSuccess(`"${product.name}" boosté avec succès`)
        setTimeout(() => setSuccess(""), 4000)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setBoostingId(null)
      }
    } else {
      setShowPayment(productId)
    }
  }

  const handlePaidBoost = async (productId: number) => {
    setPaymentLoading(true)
    setError("")
    setSuccess("")
    const boostOption = boostOptions.find(o => o.days === selectedDuration) || boostOptions[2]
    try {
      const initRes = await fetch("/api/payments/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({ productId, type: "boost", amount: boostOption.price, durationDays: selectedDuration }),
      })
      const initData = await initRes.json()
      if (!initRes.ok) throw new Error(initData.error || "Erreur d'initiation du paiement")

      const confirmRes = await fetch("/api/payments/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({ paymentId: initData.paymentId, productId, type: "boost" }),
      })
      const confirmData = await confirmRes.json()
      if (!confirmRes.ok) throw new Error(confirmData.error || "Erreur de confirmation du paiement")

      setBoosts(prev => [...prev, confirmData.boost || confirmData])
      setShowPayment(null)
      setSuccess("Paiement confirmé et produit boosté avec succès")
      setTimeout(() => setSuccess(""), 4000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setPaymentLoading(false)
    }
  }

  const activeBoosts = boosts.filter(b => b.status === "active")

  if (loading || productsLoading) {
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
            <h1 className="text-4xl font-bold text-[var(--text-primary)]">Booster mes articles</h1>
            <p className="text-[var(--text-secondary)]">
              Mettez vos produits en avant pour attirer plus de clients. {freeBoostsRemaining > 0 && (
                <span className="text-green-600 font-semibold">{freeBoostsRemaining} boost{freeBoostsRemaining > 1 ? "s" : ""} gratuit{freeBoostsRemaining > 1 ? "s" : ""} restant{freeBoostsRemaining > 1 ? "s" : ""}</span>
              )}
            </p>
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

        <div className="mb-6 flex items-center gap-4 text-sm">
          <span className="px-4 py-2 rounded-xl bg-[var(--bg-primary)] border-2 border-[var(--border)] text-[var(--text-primary)] font-semibold">
            <Zap className="w-4 h-4 inline mr-1.5 text-amber-500" />
            {activeBoosts.length} boost{activeBoosts.length > 1 ? "s" : ""} actif{activeBoosts.length > 1 ? "s" : ""}
          </span>
          <span className="px-4 py-2 rounded-xl bg-[var(--bg-primary)] border-2 border-[var(--border)] text-[var(--text-primary)] font-semibold">
            {freeBoostsRemaining} gratuit{freeBoostsRemaining > 1 ? "s" : ""} restant{freeBoostsRemaining > 1 ? "s" : ""}
            {boostsIncluded > 0 && (
              <span className="text-[var(--text-secondary)] font-normal"> / {boostsIncluded} inclus</span>
            )}
          </span>
          {boostOptions.length > 0 && (
            <span className="px-4 py-2 rounded-xl bg-[var(--bg-primary)] border-2 border-[var(--border)] text-[var(--text-primary)] font-semibold">
              Boost dès {formatCurrency(Math.min(...boostOptions.map(o => o.price)))}
            </span>
          )}
        </div>

        {activeBoosts.length > 0 && (
          <AnimatedDiv fade slideUp className="mb-8">
            <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4">Boosts actifs</h2>
            <div className="bg-[var(--bg-primary)] rounded-2xl border-2 border-[var(--border)] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[var(--bg-secondary)] text-[var(--text-secondary)] text-xs uppercase tracking-wider">
                      <th className="text-left px-6 py-4 font-semibold">Produit</th>
                      <th className="text-center px-6 py-4 font-semibold">Début</th>
                      <th className="text-center px-6 py-4 font-semibold">Fin</th>
                      <th className="text-center px-6 py-4 font-semibold">Jours restants</th>
                      <th className="text-center px-6 py-4 font-semibold">Statut</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E7EB]">
                    {activeBoosts.map(b => {
                      const remaining = Math.max(0, Math.ceil((new Date(b.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
                      return (
                        <tr key={b.id} className="hover:bg-[var(--bg-secondary)] transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-[var(--bg-secondary)] overflow-hidden shrink-0">
                                <img src={b.productImage} alt={b.productName} className="w-full h-full object-cover" />
                              </div>
                              <p className="font-semibold text-[var(--text-primary)]">{b.productName}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center text-[var(--text-secondary)]">
                            <span className="flex items-center justify-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5" />
                              {new Date(b.startDate).toLocaleDateString("fr-FR")}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center text-[var(--text-secondary)]">
                            <span className="flex items-center justify-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5" />
                              {new Date(b.endDate).toLocaleDateString("fr-FR")}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="flex items-center justify-center gap-1 font-semibold text-[var(--text-primary)]">
                              <Clock className="w-3.5 h-3-5 text-[var(--text-link)]" />
                              {remaining} jour{remaining > 1 ? "s" : ""}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="px-3 py-1 rounded-full bg-green-100 text-green-700 border-2 border-green-200 text-xs font-semibold">
                              Actif
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </AnimatedDiv>
        )}

        <AnimatedDiv fade slideUp delay={0.05}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-[var(--text-primary)]">Mes produits</h2>
            <div className="relative max-w-xs">
              <Input icon={<Search className="w-4 h-4" />} placeholder="Rechercher un produit..." value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {paginatedProducts.length === 0 ? (
              <div className="sm:col-span-2 lg:col-span-3 xl:col-span-4 text-center py-12 text-[var(--text-secondary)]">
                Aucun produit trouvé
              </div>
            ) : paginatedProducts.map((product, i) => {
              const isBoosted = boostedProductIds.has(product.id)
              return (
                <AnimatedDiv key={product.id} fade slideUp delay={0.03 * i} className="bg-[var(--bg-primary)] rounded-2xl border-2 border-[var(--border)] p-4 hover:border-[var(--border-hover)] transition-all">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-14 h-14 rounded-xl bg-[var(--bg-secondary)] overflow-hidden shrink-0">
                      <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-sm text-[var(--text-primary)] truncate">{product.name}</p>
                      <p className="text-xs text-[var(--text-secondary)]">{product.brand}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-[var(--text-primary)]">{formatCurrency(product.price)}</span>
                    {isBoosted ? (
                      <span className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-100 text-amber-700 text-xs font-semibold">
                        <Zap className="w-3 h-3" /> Boosté
                      </span>
                    ) : (
                      <Button size="sm" onClick={() => handleBoost(product.id)} disabled={boostingId === product.id}>
                        {boostingId === product.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
                        Booster
                      </Button>
                    )}
                  </div>
                </AnimatedDiv>
              )
            })}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-8">
              <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-sm text-[var(--text-secondary)]">
                Page {page} / {totalPages}
              </span>
              <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </AnimatedDiv>

        {showPayment && (() => {
          const product = products.find(p => p.id === showPayment)
          if (!product) return null
          const selectedOption = boostOptions.find(o => o.days === selectedDuration) || boostOptions[2]
          return (
            <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
              <AnimatedDiv fade slideUp className="bg-[var(--bg-primary)] rounded-2xl p-6 max-w-sm w-full shadow-2xl">
                <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center mx-auto mb-4">
                  <Zap className="w-6 h-6 text-amber-600" />
                </div>
                <h3 className="text-lg font-bold text-[var(--text-primary)] text-center mb-2">Booster ce produit</h3>
                <p className="text-sm text-[var(--text-secondary)] text-center mb-4">
                  <strong>{product.name}</strong>
                </p>
                <div className="mb-4">
                  <p className="text-sm font-semibold text-[var(--text-primary)] mb-2 text-center">Durée du boost</p>
                  <div className="flex gap-2 justify-center">
                    {boostOptions.map(opt => (
                      <button
                        key={opt.days}
                        type="button"
                        onClick={() => setSelectedDuration(opt.days)}
                        className={`px-4 py-2 rounded-xl text-sm font-semibold border-2 transition-all ${
                          selectedDuration === opt.days
                            ? "border-amber-500 bg-amber-50 text-amber-700"
                            : "border-[var(--border)] text-[var(--text-secondary)] hover:border-amber-300"
                        }`}
                      >
                        {opt.days}j
                      </button>
                    ))}
                  </div>
                </div>
                <p className="text-3xl font-bold text-[var(--text-primary)] text-center mb-6">
                  {formatCurrency(selectedOption.price)}
                </p>
                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1" onClick={() => setShowPayment(null)}>Annuler</Button>
                  <Button className="flex-1" onClick={() => handlePaidBoost(product.id)} disabled={paymentLoading}>
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

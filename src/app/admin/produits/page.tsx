"use client"

import { useEffect, useState, useCallback } from "react"
import {
  Package, ArrowLeft, Shield, Star, Trash2, TrendingUp,
  Check, X, Loader2, AlertTriangle, Search
} from "lucide-react"
import { AnimatedDiv } from "@/lib/animations"
import { useAuth } from "@/lib/auth-context"
import Button from "@/components/ui/button"
import Link from "next/link"

interface AdminProduct {
  id: number
  name: string
  brand: string
  category: string
  price: number
  rating: number
  inStock: boolean
  image: string
  shop?: { id: string; name: string }
}

export default function AdminProductsPage() {
  const { user, getAuthHeaders } = useAuth()
  const [products, setProducts] = useState<AdminProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null)

  const [deleteConfirm, setDeleteConfirm] = useState<AdminProduct | null>(null)
  const [deleting, setDeleting] = useState(false)

  const [search, setSearch] = useState("")
  const [shopFilter, setShopFilter] = useState("")

  const [boostModal, setBoostModal] = useState(false)
  const [boostProduct, setBoostProduct] = useState<AdminProduct | null>(null)
  const [boostDays, setBoostDays] = useState("30")
  const [boosting, setBoosting] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const shopId = params.get("shopId")
    const shopName = params.get("shopName")
    if (shopId) setShopFilter(shopId)
    if (shopName) setSearch(shopName)
  }, [])

  const filtered = products.filter(
    (p) =>
      (!shopFilter || p.shop?.id === shopFilter) &&
      (p.name.toLowerCase().includes(search.toLowerCase()) ||
       p.brand.toLowerCase().includes(search.toLowerCase()) ||
       p.category.toLowerCase().includes(search.toLowerCase()) ||
       (p.shop?.name || "").toLowerCase().includes(search.toLowerCase()))
  )

  const showToast = useCallback((type: "success" | "error", message: string) => {
    setToast({ type, message })
    setTimeout(() => setToast(null), 4000)
  }, [])

  const fetchProducts = useCallback(async () => {
    const headers = getAuthHeaders()
    setLoading(true)
    try {
      const url = shopFilter ? `/api/products?limit=100&shopId=${shopFilter}` : "/api/products?limit=100"
      const res = await fetch(url, { headers })
      const data = await res.json()
      setProducts(data.products || [])
    } catch {
      showToast("error", "Erreur lors du chargement")
    } finally {
      setLoading(false)
    }
  }, [showToast, shopFilter])

  useEffect(() => {
    if (user?.role === "admin") fetchProducts()
  }, [user, fetchProducts])

  const handleDeleteProduct = async () => {
    if (!deleteConfirm) return
    const headers = getAuthHeaders()
    setDeleting(true)
    try {
      const res = await fetch(`/api/products/${deleteConfirm.id}`, {
        method: "DELETE",
        headers,
      })
      if (!res.ok) throw new Error("Erreur lors de la suppression")
      showToast("success", `${deleteConfirm.name} supprimé`)
      setDeleteConfirm(null)
      fetchProducts()
    } catch {
      showToast("error", "Erreur lors de la suppression")
    } finally {
      setDeleting(false)
    }
  }

  const handleBoostProduct = async () => {
    if (!boostProduct) return
    const headers = getAuthHeaders()
    setBoosting(true)
    try {
      const res = await fetch("/api/admin/products/boost", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...headers },
        body: JSON.stringify({
          productId: boostProduct.id,
          durationDays: Number(boostDays),
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Erreur lors du boost")
      }
      showToast("success", `${boostProduct.name} boosté pour ${boostDays} jours`)
      setBoostModal(false)
      setBoostProduct(null)
    } catch (err) {
      showToast("error", err instanceof Error ? err.message : "Erreur lors du boost")
    } finally {
      setBoosting(false)
    }
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Link href={shopFilter ? "/admin/boutiques" : "/admin"} className="p-2 rounded-xl bg-[var(--bg-primary)] hover:bg-[var(--bg-secondary)] transition-colors"><ArrowLeft className="w-5 h-5 text-[var(--text-secondary)]" /></Link>
          <div>
            <h1 className="text-4xl font-bold text-[var(--text-primary)]">
              {shopFilter && products[0]?.shop?.name ? `Produits · ${products[0].shop.name}` : "Produits"}
            </h1>
            <p className="text-[var(--text-secondary)]">{products.length} références{search ? ` · ${filtered.length} trouvées` : ""}</p>
          </div>
          {shopFilter && (
            <Link href="/admin/boutiques" className="ml-auto text-sm text-[var(--text-link)] hover:underline">
              Retour aux boutiques
            </Link>
          )}
        </div>

        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
          <input
            type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un produit par nom, marque ou catégorie..."
            className="w-full rounded-2xl border-2 border-[var(--border)] bg-[var(--bg-primary)] pl-10 pr-4 py-3 text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] transition-all duration-300 focus:border-[var(--border-hover)] focus:outline-none focus:ring-4 focus:ring-[#1769F2]/10 hover:border-[var(--border-hover)]/30 text-sm"
          />
        </div>

        {loading ? (
          <p className="text-center text-[var(--text-secondary)] py-12">Chargement...</p>
        ) : products.length === 0 ? (
          <div className="text-center py-12 bg-[var(--bg-primary)] rounded-2xl border-2 border-[var(--border)]">
            <Package className="w-12 h-12 text-[#1E293B] mx-auto mb-4" />
            <p className="text-[var(--text-secondary)]">Aucun produit dans le catalogue</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 bg-[var(--bg-primary)] rounded-2xl border-2 border-[var(--border)]">
            <Search className="w-12 h-12 text-[#1E293B] mx-auto mb-4" />
            <p className="text-[var(--text-secondary)]">Aucun produit ne correspond à votre recherche</p>
          </div>
        ) : (
          <div className="bg-[var(--bg-primary)] rounded-2xl border-2 border-[var(--border)] overflow-hidden">
            <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-[var(--bg-secondary)] border-b border-[var(--border)] text-xs font-semibold text-[var(--text-secondary)]">
              <div className="col-span-3">Produit</div>
              <div className="col-span-2">Boutique</div>
              <div className="col-span-2">Prix</div>
              <div className="col-span-2">Catégorie</div>
              <div className="col-span-1">Stock</div>
              <div className="col-span-2">Actions</div>
            </div>
            {filtered.map((p, i) => (
              <AnimatedDiv key={p.id} fade slideUp delay={i * 0.02} className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-[var(--border)] last:border-0 items-center hover:bg-[var(--bg-secondary)]/50 transition-colors">
                <div className="col-span-3 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[var(--bg-secondary)] overflow-hidden flex-shrink-0">
                    <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[var(--text-primary)]">{p.name}</p>
                    <p className="text-[10px] text-[var(--text-secondary)]">{p.brand}</p>
                  </div>
                </div>
                <div className="col-span-2 text-xs text-[var(--text-secondary)]">
                  {p.shop ? (
                    <Link href={`/admin/produits?shopId=${p.shop.id}&shopName=${encodeURIComponent(p.shop.name)}`}
                      className="text-[var(--text-link)] hover:underline font-medium">
                      {p.shop.name}
                    </Link>
                  ) : "Plateforme"}
                </div>
                <div className="col-span-2 text-sm font-bold text-[var(--text-primary)]">{p.price.toLocaleString("fr-FR")} F</div>
                <div className="col-span-2 text-xs text-[var(--text-secondary)]">{p.category}</div>
                <div className="col-span-1">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${p.inStock ? "text-green-400 bg-green-500/15" : "text-red-400 bg-red-500/15"}`}>
                    {p.inStock ? "Oui" : "Non"}
                  </span>
                </div>
                <div className="col-span-2 flex items-center gap-2">
                  <button
                    onClick={() => {
                      setBoostProduct(p)
                      setBoostDays("30")
                      setBoostModal(true)
                    }}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-purple-400 bg-purple-500/10 hover:bg-purple-500/20 transition-colors"
                  >
                    <TrendingUp className="w-3 h-3" /> Booster
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(p)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-red-400 bg-red-500/10 hover:bg-red-500/20 transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </AnimatedDiv>
            ))}
          </div>
        )}
      </div>

      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !deleting && setDeleteConfirm(null)} />
          <div className="relative bg-[var(--bg-primary)] border-2 border-[var(--border)] rounded-2xl w-full max-w-sm shadow-2xl p-6 text-center">
            <div className="w-12 h-12 rounded-xl bg-red-500/15 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-6 h-6 text-red-400" />
            </div>
            <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2">Supprimer le produit</h3>
            <p className="text-sm text-[var(--text-secondary)] mb-6">
              Êtes-vous sûr de vouloir supprimer <strong className="text-[var(--text-primary)]">{deleteConfirm.name}</strong> ?
            </p>
            <div className="flex items-center justify-center gap-3">
              <Button variant="outline" size="sm" onClick={() => setDeleteConfirm(null)} disabled={deleting}>
                Annuler
              </Button>
              <Button size="sm" onClick={handleDeleteProduct} disabled={deleting}
                className="bg-red-500 hover:bg-red-600 text-white">
                {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Supprimer
              </Button>
            </div>
          </div>
        </div>
      )}

      {boostModal && boostProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !boosting && setBoostModal(false)} />
          <div className="relative bg-[var(--bg-primary)] border-2 border-[var(--border)] rounded-2xl w-full max-w-md shadow-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <TrendingUp className="w-5 h-5 text-purple-400" />
                <h3 className="text-lg font-bold text-[var(--text-primary)]">Booster un produit</h3>
              </div>
              <button onClick={() => !boosting && setBoostModal(false)} className="p-1 rounded-lg hover:bg-[var(--bg-secondary)] text-[var(--text-muted)]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm text-[var(--text-secondary)] mb-6">
              Booster <strong className="text-[var(--text-primary)]">{boostProduct.name}</strong> le mettra en avant dans les listes de produits.
            </p>

            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">Durée (jours)</label>
              <select value={boostDays} onChange={(e) => setBoostDays(e.target.value)}
                className="w-full rounded-2xl border-2 border-[var(--border)] bg-[var(--bg-primary)] px-4 py-3 text-[var(--text-primary)] transition-all duration-300 focus:border-[var(--border-hover)] focus:outline-none focus:ring-4 focus:ring-[#1769F2]/10 hover:border-[var(--border-hover)]/30 text-sm mb-4">
                <option value="7">7 jours</option>
                <option value="15">15 jours</option>
                <option value="30">30 jours</option>
                <option value="60">60 jours</option>
                <option value="90">90 jours</option>
              </select>
            </div>

            <div className="flex items-center justify-end gap-3 mt-6 pt-6 border-t border-[var(--border)]">
              <Button variant="outline" size="sm" onClick={() => setBoostModal(false)} disabled={boosting}>
                Annuler
              </Button>
              <Button size="sm" onClick={handleBoostProduct} disabled={boosting}>
                {boosting ? <Loader2 className="w-4 h-4 animate-spin" /> : <TrendingUp className="w-4 h-4" />}
                Booster gratuitement
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

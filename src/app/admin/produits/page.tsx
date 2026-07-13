"use client"

import { useEffect, useState, useCallback } from "react"
import toast from "react-hot-toast"
import { Package, ArrowLeft, Shield, Trash2, TrendingUp, Loader2, AlertTriangle, Search, X } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import Button from "@/components/ui/button"
import Link from "next/link"
import { LoadingSpinner } from "@/components/ui/loading-spinner"

interface AdminProduct { id: number; name: string; brand: string; category: string; price: number; rating: number; inStock: boolean; image: string; shop?: { id: string; name: string } }

export default function AdminProductsPage() {
  const { user, getAuthHeaders } = useAuth()
  const [products, setProducts] = useState<AdminProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [shopFilter, setShopFilter] = useState("")
  const [deleteConfirm, setDeleteConfirm] = useState<AdminProduct | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [boostModal, setBoostModal] = useState(false)
  const [boostProduct, setBoostProduct] = useState<AdminProduct | null>(null)
  const [boostDays, setBoostDays] = useState("30")
  const [boosting, setBoosting] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const shopId = params.get("shopId")
    if (shopId) setShopFilter(shopId)
  }, [])

  const fetchProducts = useCallback(async () => {
    const headers = getAuthHeaders()
    setLoading(true)
    try {
      const url = shopFilter ? `/api/products?limit=100&shopId=${shopFilter}` : "/api/products?limit=100"
      const res = await fetch(url, { headers })
      const data = await res.json()
      setProducts(data.products || [])
    } catch { toast.error("Erreur chargement produits") }
    finally { setLoading(false) }
  }, [getAuthHeaders, shopFilter])

  useEffect(() => { if (user?.role === "admin") fetchProducts() }, [user, fetchProducts])

  const handleDelete = async () => {
    if (!deleteConfirm) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/products/${deleteConfirm.id}`, { method: "DELETE", headers: getAuthHeaders() })
      if (!res.ok) throw new Error("Erreur")
      toast.success(`${deleteConfirm.name} supprimé`)
      setDeleteConfirm(null); fetchProducts()
    } catch { toast.error("Erreur suppression") }
    finally { setDeleting(false) }
  }

  const handleBoost = async () => {
    if (!boostProduct) return
    setBoosting(true)
    try {
      const res = await fetch("/api/admin/products/boost", {
        method: "POST", headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({ productId: boostProduct.id, durationDays: Number(boostDays) }),
      })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || "Erreur") }
      toast.success(`${boostProduct.name} boosté ${boostDays} jours`)
      setBoostModal(false); setBoostProduct(null)
    } catch (err) { toast.error(err instanceof Error ? err.message : "Erreur") }
    finally { setBoosting(false) }
  }

  const filtered = products.filter(p =>
    !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.brand.toLowerCase().includes(search.toLowerCase())
  )

  if (!user || user.role !== "admin") {
    return <div className="flex items-center justify-center min-h-[60vh]"><Shield className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-4" /><p className="text-[var(--text-secondary)]">Accès restreint</p></div>
  }

  return (
    <div className="p-4 lg:p-8 space-y-6">
      <div className="flex items-center gap-4">
        <Link href={shopFilter ? "/admin/boutiques" : "/admin"} className="p-2 rounded-xl bg-[var(--bg-card)] border border-[var(--border)] hover:border-[var(--border-hover)]/30 transition-colors"><ArrowLeft className="w-5 h-5 text-[var(--text-secondary)]" /></Link>
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">{shopFilter && products[0]?.shop?.name ? `Produits · ${products[0].shop.name}` : "Produits"}</h1>
          <p className="text-sm text-[var(--text-secondary)]">{products.length} références</p>
        </div>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
        <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher un produit..."
          className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-card)] pl-10 pr-4 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--border-hover)]/30 transition-colors" />
      </div>

      {loading ? <LoadingSpinner className="py-20" size="lg" />
      : filtered.length === 0 ? <p className="text-center text-[var(--text-muted)] py-12">Aucun produit trouvé</p>
      : <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] overflow-hidden">
          <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-[var(--bg-elevated)] border-b border-[var(--border)] text-xs font-semibold text-[var(--text-muted)]">
            <div className="col-span-4">Produit</div>
            <div className="col-span-2">Boutique</div>
            <div className="col-span-2">Prix</div>
            <div className="col-span-2">Catégorie</div>
            <div className="col-span-2">Actions</div>
          </div>
          {filtered.map((p) => (
              <div key={p.id} className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-[var(--border)] last:border-0 items-center hover:bg-[var(--bg-elevated)] transition-colors">
                <div className="col-span-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[var(--bg-elevated)] overflow-hidden flex-shrink-0">
                  <img src={p.image} alt={p.name} className="w-full h-full object-contain" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[var(--text-primary)]">{p.name}</p>
                  <p className="text-[10px] text-[var(--text-muted)]">{p.brand}</p>
                </div>
              </div>
              <div className="col-span-2 text-xs text-[var(--text-secondary)]">{p.shop?.name || "Plateforme"}</div>
              <div className="col-span-2 text-sm font-bold text-[var(--text-primary)]">{p.price.toLocaleString("fr-FR")} F</div>
              <div className="col-span-2 text-xs text-[var(--text-secondary)]">{p.category}</div>
              <div className="col-span-2 flex items-center gap-2">
                <button onClick={() => { setBoostProduct(p); setBoostDays("30"); setBoostModal(true) }}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-purple-400 bg-purple-500/10 hover:bg-purple-500/20 transition-colors">
                  <TrendingUp className="w-3 h-3" /> Booster
                </button>
                <button onClick={() => setDeleteConfirm(p)}
                  className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      }

      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !deleting && setDeleteConfirm(null)} />
          <div className="relative bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl w-full max-w-sm shadow-2xl p-6 text-center">
            <div className="w-12 h-12 rounded-xl bg-red-500/15 flex items-center justify-center mx-auto mb-4"><AlertTriangle className="w-6 h-6 text-red-400" /></div>
            <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2">Supprimer le produit</h3>
            <p className="text-sm text-[var(--text-secondary)] mb-6">Supprimer <strong className="text-[var(--text-primary)]">{deleteConfirm.name}</strong> ?</p>
            <div className="flex items-center justify-center gap-3">
              <Button variant="outline" size="sm" onClick={() => setDeleteConfirm(null)} disabled={deleting}>Annuler</Button>
              <Button size="sm" onClick={handleDelete} disabled={deleting} className="bg-red-500 hover:bg-red-600 text-white">
                {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : null} Supprimer
              </Button>
            </div>
          </div>
        </div>
      )}

      {boostModal && boostProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !boosting && setBoostModal(false)} />
          <div className="relative bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl w-full max-w-md shadow-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3"><TrendingUp className="w-5 h-5 text-purple-400" /><h3 className="text-lg font-bold text-[var(--text-primary)]">Booster un produit</h3></div>
              <button onClick={() => !boosting && setBoostModal(false)} className="p-1 rounded-lg hover:bg-[var(--bg-hover)] text-[var(--text-muted)]"><X className="w-5 h-5" /></button>
            </div>
            <p className="text-sm text-[var(--text-secondary)] mb-6">Booster <strong className="text-[var(--text-primary)]">{boostProduct.name}</strong> le mettra en avant.</p>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">Durée (jours)</label>
            <select value={boostDays} onChange={e => setBoostDays(e.target.value)}
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-card)] px-4 py-2.5 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--border-hover)]/30 mb-4">
              <option value="7">7 jours</option>
              <option value="15">15 jours</option>
              <option value="30">30 jours</option>
              <option value="60">60 jours</option>
              <option value="90">90 jours</option>
            </select>
            <div className="flex items-center justify-end gap-3 pt-6 border-t border-[var(--border)]">
              <Button variant="outline" size="sm" onClick={() => setBoostModal(false)} disabled={boosting}>Annuler</Button>
              <Button size="sm" onClick={handleBoost} disabled={boosting}>
                {boosting ? <Loader2 className="w-4 h-4 animate-spin" /> : <TrendingUp className="w-4 h-4" />} Booster gratuitement
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

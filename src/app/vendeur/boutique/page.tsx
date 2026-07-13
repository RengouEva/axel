"use client"

import { useState, useEffect, useCallback } from "react"
import { Store, MapPin, Phone, Mail, Pencil, X, Save, AlertTriangle, CheckCircle, Loader2, Plus, Trash2, Search, Package, ImagePlus, Upload } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import type { Country, City, District } from "@/data/delivery"
import type { Category } from "@/data/categories"
import type { Product } from "@/data/products"
import Button from "@/components/ui/button"
import Input from "@/components/ui/input"
import Badge from "@/components/ui/badge"
import { AnimatedDiv } from "@/lib/animations"
import Link from "next/link"

const creditDurations = [3, 6, 12, 18, 24, 36]

function parseRatesForForm(raw?: string): Record<string, string> {
  try {
    const parsed = raw ? JSON.parse(raw) : {}
    return Object.fromEntries(creditDurations.map(d => [String(d), String(parsed[String(d)] ?? "" )]))
  } catch {
    return Object.fromEntries(creditDurations.map(d => [String(d), ""]))
  }
}

interface ShopBadge {
  type: string
  label: string
  color: string
  icon?: string
}

interface ShopData {
  id: string
  sellerId: number
  name: string
  slug: string
  description: string
  phone: string
  email: string
  logo: string
  coverImage: string
  countryId: string
  cityId: string
  districtId: string
  address: string
  category: string
  rating: number
  totalSales: number
  createdAt: string
  badges?: ShopBadge[]
}

const emptyForm = {
  name: "",
  description: "",
  phone: "",
  email: "",
  countryId: "",
  cityId: "",
  districtId: "",
  address: "",
  category: "",
}

const emptyProductForm = { name: "", brand: "", category: "Téléphones", price: "", description: "", creditMonths: "36", creditRates: "{}", images: [""] as string[], inStock: true, promotion: false }

export default function SellerBoutiquePage() {
  const { user, getAuthHeaders } = useAuth()
  const [shop, setShop] = useState<ShopData | null>(null)
  const [loading, setLoading] = useState(true)
  const [categories, setCategories] = useState<Category[]>([])
  const [countries, setCountries] = useState<Country[]>([])
  const [cities, setCities] = useState<City[]>([])
  const [districts, setDistricts] = useState<District[]>([])
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [form, setForm] = useState(emptyForm)

  const [products, setProducts] = useState<Product[]>([])
  const [showProductForm, setShowProductForm] = useState(false)
  const [editingProductId, setEditingProductId] = useState<number | null>(null)
  const [deleteProductId, setDeleteProductId] = useState<number | null>(null)
  const [productForm, setProductForm] = useState(emptyProductForm)
  const [uploading, setUploading] = useState(false)
  const [rateInputs, setRateInputs] = useState<Record<string, string>>(Object.fromEntries(creditDurations.map(d => [String(d), ""])))
  const [productSearch, setProductSearch] = useState("")
  const [productError, setProductError] = useState("")

  useEffect(() => {
    fetch("/api/categories").then(r => r.json()).then(data => setCategories(data.categories || []))
    fetch("/api/locations").then(r => r.json()).then(data => {
      setCountries(data.countries || [])
      setCities(data.cities || [])
      setDistricts(data.districts || [])
    })
  }, [])

  const filteredCities = form.countryId ? cities.filter(c => c.countryId === form.countryId) : []
  const filteredDistricts = form.cityId ? districts.filter(d => d.cityId === form.cityId) : []

  const fetchShop = useCallback(async () => {
    if (!user) return
    try {
      const res = await fetch(`/api/shops?sellerId=${user.id}`, {
        headers: getAuthHeaders(),
      })
      const data = await res.json()
      if (Array.isArray(data) && data.length > 0) {
        setShop(data[0])
      }
    } catch (err) {
      console.error("Erreur chargement boutique:", err)
    } finally {
      setLoading(false)
    }
  }, [user, getAuthHeaders])

  const fetchProducts = useCallback(async (shopId: string) => {
    try {
      const res = await fetch(`/api/products?shopId=${shopId}`)
      const data = await res.json()
      setProducts(data.products || [])
    } catch {
      console.error("Erreur chargement produits")
    }
  }, [])

  useEffect(() => {
    fetchShop()
  }, [fetchShop])

  useEffect(() => {
    if (shop) fetchProducts(shop.id)
  }, [shop, fetchProducts])

  const resetProductForm = () => {
    setProductForm(emptyProductForm)
    setEditingProductId(null)
    setShowProductForm(false)
    setRateInputs(Object.fromEntries(creditDurations.map(d => [String(d), ""])))
    setProductError("")
  }

  const openEditProduct = (p: Product) => {
    const defaultRates = JSON.stringify({ "3": 0, "6": 0, "12": 3, "18": 5, "24": 5, "36": 8 })
    const raw = (p as any).creditRates || defaultRates
    setProductForm({
      name: p.name,
      brand: p.brand,
      category: p.category,
      price: String(p.price),
      description: (p as any).description || "",
      creditMonths: "36",
      creditRates: raw,
      images: p.images.length > 0 ? p.images : [p.image],
      inStock: p.inStock,
      promotion: p.promotion,
    })
    setRateInputs(parseRatesForForm(raw))
    setEditingProductId(p.id)
    setShowProductForm(true)
    setProductError("")
  }

  const uploadFile = async (file: File): Promise<string> => {
    const fd = new FormData()
    fd.append("file", file)
    const res = await fetch("/api/upload", { method: "POST", body: fd })
    if (!res.ok) throw new Error("Échec du téléchargement")
    const data = await res.json()
    return data.url
  }

  const handleProductImage = async (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const url = await uploadFile(file)
      const newImages = [...productForm.images]
      newImages[index] = url
      setProductForm(f => ({ ...f, images: newImages }))
    } catch {
      alert("Erreur lors du téléchargement de l'image")
    } finally {
      setUploading(false)
      e.target.value = ""
    }
  }

  const addProductImage = () => {
    setProductForm(f => ({ ...f, images: [...f.images, ""] }))
  }

  const removeProductImage = (index: number) => {
    if (productForm.images.length <= 1) return
    setProductForm(f => ({ ...f, images: f.images.filter((_, i) => i !== index) }))
  }

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setProductError("")
    const price = Number(productForm.price)
    if (!productForm.name || !productForm.brand || !price) return

    const validImages = productForm.images.filter(Boolean)
    const finalImages = validImages.length > 0 ? validImages : ["/images/visuel.png"]
    const mainImage = finalImages[0]
    const creditMonths = Number(productForm.creditMonths) || 36

    const creditRates = JSON.stringify(
      Object.fromEntries(creditDurations.map(d => [String(d), Number(rateInputs[String(d)]) || 0]))
    )

    const productData: Record<string, unknown> = {
      name: productForm.name,
      brand: productForm.brand,
      category: shop?.category || productForm.category,
      price,
      description: productForm.description,
      image: mainImage,
      images: JSON.stringify(finalImages),
      creditMonths,
      creditRates,
      inStock: productForm.inStock,
      promotion: productForm.promotion,
    }

    try {
      let ok = false
      if (editingProductId) {
        const res = await fetch(`/api/products/${editingProductId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", ...getAuthHeaders() },
          body: JSON.stringify(productData),
        })
        if (res.ok) {
          ok = true
          if (shop) await fetchProducts(shop.id)
        } else {
          const err = await res.json()
          setProductError(err.error || "Erreur lors de la modification")
          return
        }
      } else {
        const res = await fetch("/api/products", {
          method: "POST",
          headers: { "Content-Type": "application/json", ...getAuthHeaders() },
          body: JSON.stringify(productData),
        })
        if (res.ok) {
          ok = true
          if (shop) await fetchProducts(shop.id)
        } else {
          const err = await res.json()
          setProductError(err.error || "Erreur lors de la création")
          return
        }
      }
      if (ok) resetProductForm()
    } catch {
      setProductError("Erreur réseau. Veuillez réessayer.")
    }
  }

  const handleDeleteProduct = async () => {
    if (!deleteProductId) return
    const res = await fetch(`/api/products/${deleteProductId}`, { method: "DELETE", headers: getAuthHeaders() })
    if (res.ok) {
      setProducts(prev => prev.filter(p => p.id !== deleteProductId))
      setDeleteProductId(null)
    }
  }

  const startEdit = () => {
    if (!shop) return
    setForm({
      name: shop.name,
      description: shop.description,
      phone: shop.phone,
      email: shop.email,
      countryId: shop.countryId,
      cityId: shop.cityId,
      districtId: shop.districtId,
      address: shop.address,
      category: shop.category,
    })
    setEditing(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")
    setSaving(true)

    const payload = {
      name: form.name,
      description: form.description,
      phone: form.phone,
      email: form.email,
      countryId: form.countryId,
      cityId: form.cityId,
      districtId: form.districtId,
      address: form.address,
      category: form.category,
    }

    try {
      const method = shop ? "PUT" : "POST"
      const url = shop ? `/api/shops/${shop.id}` : "/api/shops"
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Une erreur est survenue")
      }

      const savedShop = await res.json()
      setShop(savedShop)
      setEditing(false)
      setSuccess(shop ? "Boutique mise à jour avec succès" : "Boutique créée avec succès")
      setTimeout(() => setSuccess(""), 4000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
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
            <h1 className="text-4xl font-bold text-[var(--text-primary)]">Ma boutique</h1>
            <p className="text-[var(--text-secondary)]">
              {shop ? "Gérez les informations de votre boutique" : "Créez votre boutique pour commencer à vendre"}
            </p>
          </div>
          {shop && !editing && (
            <Button onClick={startEdit}>
              <Pencil className="w-4 h-4" /> Modifier
            </Button>
          )}
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

        {!shop && !editing ? (
          <AnimatedDiv fade slideUp>
            <div className="max-w-2xl mx-auto bg-[var(--bg-primary)] rounded-2xl border-2 border-[var(--border)] p-8 text-center">
              <div className="w-16 h-16 rounded-2xl bg-[var(--text-link)]/10 flex items-center justify-center mx-auto mb-4">
                <Store className="w-8 h-8 text-[var(--text-link)]" />
              </div>
              <h2 className="text-xl font-bold text-[var(--text-primary)] mb-2">Vous n'avez pas encore de boutique</h2>
              <p className="text-[var(--text-secondary)] mb-6">
                Créez votre boutique pour commencer à vendre vos produits sur AXEL Marketplace.
              </p>
              <Button onClick={() => { setForm(emptyForm); setEditing(true) }}>
                Créer ma boutique
              </Button>
            </div>
          </AnimatedDiv>
        ) : editing ? (
          <AnimatedDiv fade slideUp className="max-w-2xl mx-auto">
            <form onSubmit={handleSubmit} className="bg-[var(--bg-primary)] rounded-2xl border-2 border-[var(--border)] p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-[var(--text-primary)]">
                  {shop ? "Modifier ma boutique" : "Créer ma boutique"}
                </h2>
                {shop && (
                  <button type="button" onClick={() => setEditing(false)} className="p-2 rounded-xl hover:bg-[var(--bg-secondary)]">
                    <X className="w-5 h-5 text-[var(--text-secondary)]" />
                  </button>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">Nom de la boutique *</label>
                  <Input placeholder="Ma Boutique" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">Description</label>
                  <textarea
                    placeholder="Décrivez votre boutique..."
                    value={form.description}
                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    rows={3}
                    className="w-full px-4 py-2.5 rounded-xl border-2 border-[var(--border)] text-sm text-[var(--text-primary)] bg-[var(--bg-primary)] focus:border-[var(--border-hover)] focus:outline-none resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">Catégorie *</label>
                  <select
                    value={form.category}
                    onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                    required
                    className="w-full px-4 py-2.5 rounded-xl border-2 border-[var(--border)] text-sm text-[var(--text-primary)] bg-[var(--bg-primary)] focus:border-[var(--border-hover)] focus:outline-none"
                  >
                    <option value="">Sélectionner une catégorie</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">Téléphone</label>
                    <Input icon={<Phone className="w-4 h-4" />} placeholder="+237 6 XX XX XX XX" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">Email</label>
                    <Input icon={<Mail className="w-4 h-4" />} type="email" placeholder="contact@boutique.com" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
                  </div>
                </div>

                <div className="grid sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">Pays *</label>
                    <select
                      value={form.countryId}
                      onChange={e => setForm(f => ({ ...f, countryId: e.target.value, cityId: "", districtId: "" }))}
                      required
                      className="w-full px-4 py-2.5 rounded-xl border-2 border-[var(--border)] text-sm text-[var(--text-primary)] bg-[var(--bg-primary)] focus:border-[var(--border-hover)] focus:outline-none"
                    >
                      <option value="">Sélectionner</option>
                      {countries.map(c => (
                        <option key={c.id} value={c.id}>{c.flag} {c.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">Ville</label>
                    {form.countryId && filteredCities.length > 0 ? (
                      <select
                        value={form.cityId}
                        onChange={e => setForm(f => ({ ...f, cityId: e.target.value, districtId: "" }))}
                        className="w-full px-4 py-2.5 rounded-xl border-2 border-[var(--border)] text-sm text-[var(--text-primary)] bg-[var(--bg-primary)] focus:border-[var(--border-hover)] focus:outline-none"
                      >
                        <option value="">Sélectionner</option>
                        {filteredCities.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text" placeholder="Saisir la ville" value={form.cityId === null ? "" : form.cityId}
                        onChange={e => setForm(f => ({ ...f, cityId: e.target.value, districtId: "" }))}
                        disabled={!form.countryId}
                        className="w-full px-4 py-2.5 rounded-xl border-2 border-[var(--border)] text-sm text-[var(--text-primary)] bg-[var(--bg-primary)] focus:border-[var(--border-hover)] focus:outline-none disabled:opacity-50"
                      />
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">Quartier</label>
                    {form.cityId && filteredDistricts.length > 0 ? (
                      <select
                        value={form.districtId}
                        onChange={e => setForm(f => ({ ...f, districtId: e.target.value }))}
                        className="w-full px-4 py-2.5 rounded-xl border-2 border-[var(--border)] text-sm text-[var(--text-primary)] bg-[var(--bg-primary)] focus:border-[var(--border-hover)] focus:outline-none"
                      >
                        <option value="">Sélectionner</option>
                        {filteredDistricts.map(d => (
                          <option key={d.id} value={d.id}>{d.name}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text" placeholder="Saisir le quartier" value={form.districtId === null ? "" : form.districtId}
                        onChange={e => setForm(f => ({ ...f, districtId: e.target.value }))}
                        disabled={!form.cityId}
                        className="w-full px-4 py-2.5 rounded-xl border-2 border-[var(--border)] text-sm text-[var(--text-primary)] bg-[var(--bg-primary)] focus:border-[var(--border-hover)] focus:outline-none disabled:opacity-50"
                      />
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">Adresse</label>
                  <Input icon={<MapPin className="w-4 h-4" />} placeholder="Rue, quartier, point de repère..." value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} />
                </div>
              </div>

              <div className="flex items-center gap-3 mt-6 pt-6 border-t-2 border-[var(--border)]">
                <Button type="submit" disabled={saving}>
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {saving ? "Enregistrement..." : shop ? "Enregistrer les modifications" : "Créer la boutique"}
                </Button>
                {shop && (
                  <Button type="button" variant="outline" onClick={() => setEditing(false)}>
                    Annuler
                  </Button>
                )}
              </div>
            </form>
          </AnimatedDiv>
        ) : shop ? (
          <AnimatedDiv fade slideUp>
            <div className="bg-[var(--bg-primary)] rounded-2xl border-2 border-[var(--border)] overflow-hidden">
              <div className="h-32 bg-gradient-to-r from-[var(--text-link)]/20 to-blue-100" />
              <div className="px-8 pb-8 -mt-12">
                <div className="w-24 h-24 rounded-2xl bg-[var(--bg-primary)] border-4 border-[var(--bg-primary)] shadow-lg flex items-center justify-center mb-4">
                  <Store className="w-10 h-10 text-[var(--text-link)]" />
                </div>

                <div className="grid sm:grid-cols-2 gap-6">
                  <div>
                    <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-1">{shop.name}</h2>
                    {shop.category && (
                      <span className="inline-block mb-3 px-3 py-1 rounded-full bg-[var(--text-link)]/10 text-xs font-semibold text-[var(--text-link)]">
                        {shop.category}
                      </span>
                    )}
                    {shop.badges && shop.badges.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {shop.badges.map(badge => (
                          <span
                            key={badge.type}
                            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold leading-tight"
                            style={{ backgroundColor: badge.color + "20", color: badge.color }}
                          >
                            {badge.label}
                          </span>
                        ))}
                      </div>
                    )}
                    <p className="text-sm text-[var(--text-secondary)] mb-4">{shop.description || "Aucune description"}</p>

                    <div className="space-y-2">
                      {shop.phone && (
                        <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                          <Phone className="w-4 h-4 shrink-0" /> {shop.phone}
                        </div>
                      )}
                      {shop.email && (
                        <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                          <Mail className="w-4 h-4 shrink-0" /> {shop.email}
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                        <MapPin className="w-4 h-4 shrink-0" />
                        {shop.address ? `${shop.address}, ` : ""}
                        {districts.find(d => d.id === shop.districtId)?.name}, {cities.find(c => c.id === shop.cityId)?.name}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end justify-between">
                    <div className="flex items-center gap-4 text-sm">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-[var(--text-primary)]">{shop.rating}</p>
                        <p className="text-xs text-[var(--text-secondary)]">Note</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-[var(--text-primary)]">{shop.totalSales}</p>
                        <p className="text-xs text-[var(--text-secondary)]">Ventes</p>
                      </div>
                    </div>
                    <p className="text-xs text-[var(--text-muted)] mt-4">
                      Créée le {new Date(shop.createdAt).toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </AnimatedDiv>
        ) : null}

        {shop && !editing && (
          <AnimatedDiv fade slideUp className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-[var(--text-primary)]">Produits</h2>
                <p className="text-sm text-[var(--text-secondary)]">{products.length} produit{products.length > 1 ? "s" : ""}</p>
              </div>
              <Button onClick={() => { resetProductForm(); setShowProductForm(true) }}>
                <Plus className="w-4 h-4" /> Ajouter un produit
              </Button>
            </div>

            {showProductForm && (
              <div className="mb-6 p-6 rounded-2xl bg-[var(--bg-primary)] border-2 border-[var(--border-hover)]/30 shadow-lg">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-[var(--text-primary)]">{editingProductId ? "Modifier le produit" : "Nouveau produit"}</h3>
                  <button onClick={resetProductForm} className="p-2 rounded-xl hover:bg-[var(--bg-secondary)]"><X className="w-5 h-5 text-[var(--text-secondary)]" /></button>
                </div>
                {productError && (
                  <div className="mb-4 p-3 rounded-xl bg-red-50 border-2 border-red-200 flex items-center gap-2 text-sm text-red-700 font-medium">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    {productError}
                  </div>
                )}
                <form onSubmit={handleProductSubmit} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="sm:col-span-2 lg:col-span-3">
                    <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">Images du produit</label>
                    <div className="space-y-2">
                      {productForm.images.map((img, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <div className="flex-1">
                            <div className="relative">
                              <input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml"
                                onChange={e => handleProductImage(e, i)}
                                className="w-full px-4 py-2.5 rounded-xl border-2 border-[var(--border)] text-sm text-[var(--text-secondary)] bg-[var(--bg-primary)] file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-[var(--text-link)] file:text-white hover:file:brightness-110 cursor-pointer focus:border-[var(--border-hover)] focus:outline-none"
                              />
                              {uploading && (
                                <div className="absolute inset-0 bg-white/60 rounded-xl flex items-center justify-center">
                                  <Loader2 className="w-5 h-5 animate-spin text-[var(--text-link)]" />
                                </div>
                              )}
                            </div>
                          </div>
                          {img && (
                            <div className="w-10 h-10 rounded-lg border-2 border-[var(--border)] overflow-hidden shrink-0">
                              <img src={img} alt="" className="w-full h-full object-contain" />
                            </div>
                          )}
                          {productForm.images.length > 1 && (
                            <button type="button" onClick={() => removeProductImage(i)} className="p-2 rounded-lg hover:bg-red-50 text-[var(--text-secondary)] hover:text-red-500 shrink-0">
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                    <button type="button" onClick={addProductImage} className="mt-2 flex items-center gap-1.5 text-sm text-[var(--text-link)] font-medium hover:underline">
                      <ImagePlus className="w-4 h-4" /> Ajouter une image
                    </button>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">Nom du produit</label>
                    <Input placeholder="Nom du produit" value={productForm.name} onChange={e => setProductForm(f => ({ ...f, name: e.target.value }))} required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">Marque</label>
                    <Input placeholder="Marque" value={productForm.brand} onChange={e => setProductForm(f => ({ ...f, brand: e.target.value }))} required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">Catégorie</label>
                    <div className="w-full px-4 py-2.5 rounded-xl border-2 border-[var(--border)] text-sm text-[var(--text-primary)] bg-[var(--bg-secondary)]">
                      {shop?.category || productForm.category}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">Prix (F CFA)</label>
                    <Input type="number" placeholder="Prix en F CFA" value={productForm.price} onChange={e => setProductForm(f => ({ ...f, price: e.target.value }))} required />
                  </div>
                  <div className="sm:col-span-2 lg:col-span-3">
                    <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">Taux d'intérêt par durée (%)</label>
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                      {creditDurations.map(d => (
                        <div key={d}>
                          <label className="block text-xs text-[var(--text-secondary)] mb-1">{d} mois</label>
                          <input type="number" min="0" max="100" value={rateInputs[String(d)]}
                            onChange={e => setRateInputs(r => ({ ...r, [String(d)]: e.target.value }))}
                            className="w-full px-3 py-2 rounded-xl border-2 border-[var(--border)] text-sm text-[var(--text-primary)] bg-[var(--bg-primary)] focus:border-[var(--border-hover)] focus:outline-none" placeholder="0"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="sm:col-span-2 lg:col-span-3">
                    <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">Description</label>
                    <textarea placeholder="Décrivez les caractéristiques du produit..." value={productForm.description}
                      onChange={e => setProductForm(f => ({ ...f, description: e.target.value }))} rows={4}
                      className="w-full px-4 py-2.5 rounded-xl border-2 border-[var(--border)] text-sm text-[var(--text-primary)] bg-[var(--bg-primary)] focus:border-[var(--border-hover)] focus:outline-none resize-none"
                    />
                  </div>
                  <div className="flex items-end gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={productForm.inStock} onChange={e => setProductForm(f => ({ ...f, inStock: e.target.checked }))} className="w-4 h-4 text-[var(--text-link)] rounded" />
                      <span className="text-sm text-[var(--text-primary)]">En stock</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={productForm.promotion} onChange={e => setProductForm(f => ({ ...f, promotion: e.target.checked }))} className="w-4 h-4 text-[var(--text-link)] rounded" />
                      <span className="text-sm text-[var(--text-primary)]">En promotion</span>
                    </label>
                  </div>
                  <div className="flex items-end gap-2">
                    <Button type="submit" disabled={uploading}>{editingProductId ? "Enregistrer" : "Ajouter"}</Button>
                    <Button type="button" variant="outline" onClick={resetProductForm}>Annuler</Button>
                  </div>
                </form>
              </div>
            )}

            <div className="bg-[var(--bg-primary)] rounded-2xl border-2 border-[var(--border)] overflow-hidden">
              <div className="p-4 border-b-2 border-[var(--border)]">
                <div className="relative max-w-xs">
                  <Input icon={<Search className="w-4 h-4" />} placeholder="Rechercher un produit..." value={productSearch} onChange={e => setProductSearch(e.target.value)} />
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[var(--bg-secondary)] text-[var(--text-secondary)] text-xs uppercase tracking-wider">
                      <th className="text-left px-6 py-4 font-semibold">Produit</th>
                      <th className="text-left px-6 py-4 font-semibold">Catégorie</th>
                      <th className="text-right px-6 py-4 font-semibold">Prix</th>
                      <th className="text-center px-6 py-4 font-semibold">Stock</th>
                      <th className="text-center px-6 py-4 font-semibold">Promo</th>
                      <th className="text-right px-6 py-4 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E7EB]">
                    {products.filter(p =>
                      p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
                      p.brand.toLowerCase().includes(productSearch.toLowerCase())
                    ).length === 0 ? (
                      <tr><td colSpan={6} className="text-center py-12 text-[var(--text-secondary)]">
                        <Package className="w-8 h-8 mx-auto mb-2 opacity-40" />
                        Aucun produit trouvé
                      </td></tr>
                    ) : products.filter(p =>
                      p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
                      p.brand.toLowerCase().includes(productSearch.toLowerCase())
                    ).map((p) => (
                      <tr key={p.id} className="hover:bg-[var(--bg-secondary)] transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-[var(--bg-secondary)] overflow-hidden shrink-0">
                              <img src={p.image} alt={p.name} className="w-full h-full object-contain" />
                            </div>
                            <div>
                              <p className="font-semibold text-[var(--text-primary)]">{p.name}</p>
                              <p className="text-xs text-[var(--text-secondary)]">{p.brand}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-[var(--text-secondary)]">{p.category}</td>
                        <td className="px-6 py-4 text-right font-semibold text-[var(--text-primary)]">{p.price.toLocaleString("fr-FR")} F</td>
                        <td className="px-6 py-4 text-center">
                          {p.inStock ? <Badge variant="stock">En stock</Badge> : <Badge variant="promo">Épuisé</Badge>}
                        </td>
                        <td className="px-6 py-4 text-center">{p.promotion ? <CheckCircle className="w-4 h-4 text-green-500 mx-auto" /> : <span className="text-[#D1D5DB]">&mdash;</span>}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <button onClick={() => openEditProduct(p)} className="p-2 rounded-xl hover:bg-[var(--text-link)]/10 text-[var(--text-secondary)] hover:text-[var(--text-link)] transition-colors">
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button onClick={() => setDeleteProductId(p.id)} className="p-2 rounded-xl hover:bg-red-50 text-[var(--text-secondary)] hover:text-red-500 transition-colors">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </AnimatedDiv>
        )}

        {deleteProductId && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
            <AnimatedDiv fade slideUp className="bg-[var(--bg-primary)] rounded-2xl p-6 max-w-sm w-full shadow-2xl">
              <div className="w-12 h-12 rounded-2xl bg-red-100 flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-[var(--text-primary)] text-center mb-2">Supprimer le produit ?</h3>
              <p className="text-sm text-[var(--text-secondary)] text-center mb-6">Cette action est irréversible.</p>
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setDeleteProductId(null)}>Annuler</Button>
                <button onClick={handleDeleteProduct} className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700 transition-colors">Supprimer</button>
              </div>
            </AnimatedDiv>
          </div>
        )}
      </div>
    </div>
  )
}

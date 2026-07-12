"use client"

import { useState, useEffect } from "react"
import { Plus, Pencil, Trash2, Search, X, Package, Check, AlertTriangle, ImagePlus, Upload, Loader2 } from "lucide-react"
import Button from "@/components/ui/button"
import Input from "@/components/ui/input"
import Badge from "@/components/ui/badge"
import { AnimatedDiv } from "@/lib/animations"
import { type Product } from "@/data/products"
import { getCategories } from "@/data/categories"
import type { Category } from "@/data/categories"
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

const emptyForm = { name: "", brand: "", category: "Téléphones", price: "", description: "", creditMonths: "36", creditRates: "{}", images: [""] as string[], inStock: true, promotion: false }

export default function SellerProductsPage() {
  const [list, setList] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [categories, setCategories] = useState<Category[]>([])
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    getCategories().then(setCategories)
    fetch("/api/products")
      .then(r => r.json())
      .then(data => setList(data.products || []))
      .finally(() => setLoading(false))
  }, [])
  const [editingId, setEditingId] = useState<number | null>(null)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [uploading, setUploading] = useState(false)
  const [rateInputs, setRateInputs] = useState<Record<string, string>>(Object.fromEntries(creditDurations.map(d => [String(d), ""])))

  const filtered = list.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.brand.toLowerCase().includes(search.toLowerCase())
  )

  const resetForm = () => { setForm(emptyForm); setEditingId(null); setShowForm(false); setUploading(false); setRateInputs(Object.fromEntries(creditDurations.map(d => [String(d), ""]))) }

  const openEdit = (p: Product) => {
    const defaultRates = JSON.stringify({ "3": 0, "6": 0, "12": 3, "18": 5, "24": 5, "36": 8 })
    const raw = (p as any).creditRates || defaultRates
    setForm({
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
    setEditingId(p.id)
    setShowForm(true)
  }

  const uploadFile = async (file: File): Promise<string> => {
    const fd = new FormData()
    fd.append("file", file)
    const res = await fetch("/api/upload", { method: "POST", body: fd })
    if (!res.ok) throw new Error("Échec du téléchargement")
    const data = await res.json()
    return data.url
  }

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const url = await uploadFile(file)
      const newImages = [...form.images]
      newImages[index] = url
      setForm(f => ({ ...f, images: newImages }))
    } catch {
      alert("Erreur lors du téléchargement de l'image")
    } finally {
      setUploading(false)
      e.target.value = ""
    }
  }

  const addImage = () => {
    setForm(f => ({ ...f, images: [...f.images, ""] }))
  }

  const removeImage = (index: number) => {
    if (form.images.length <= 1) return
    setForm(f => ({ ...f, images: f.images.filter((_, i) => i !== index) }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const price = Number(form.price)
    if (!form.name || !form.brand || !price) return

    const validImages = form.images.filter(Boolean)
    const finalImages = validImages.length > 0 ? validImages : ["/images/visuel.png"]
    const mainImage = finalImages[0]
    const creditMonths = Number(form.creditMonths) || 36

    const creditRates = JSON.stringify(
      Object.fromEntries(creditDurations.map(d => [String(d), Number(rateInputs[String(d)]) || 0]))
    )

    const productData: Record<string, unknown> = {
      name: form.name,
      brand: form.brand,
      category: form.category,
      price,
      description: form.description,
      image: mainImage,
      images: JSON.stringify(finalImages),
      creditMonths,
      creditRates,
      inStock: form.inStock,
      promotion: form.promotion,
    }

    if (editingId) {
      const res = await fetch(`/api/products/${editingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(productData),
      })
      if (res.ok) {
        const updated = await res.json()
        setList(prev => prev.map(p => p.id === editingId ? { ...p, ...updated, monthlyPrice: Math.round(price / creditMonths), images: finalImages } : p))
      }
    } else {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(productData),
      })
      if (res.ok) {
        const created = await res.json()
        setList(prev => [...prev, { ...created, reviews: 0, rating: 0, slug: form.name.toLowerCase().replace(/\s+/g, "-"), images: finalImages }])
      }
    }
    resetForm()
  }

  const handleDelete = async () => {
    if (!deleteId) return
    const res = await fetch(`/api/products/${deleteId}`, { method: "DELETE" })
    if (res.ok) {
      setList(prev => prev.filter(p => p.id !== deleteId))
      setDeleteId(null)
    }
  }

  return (
    <div className="w-full min-h-screen bg-[var(--bg-secondary)]">
      <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-[var(--text-primary)]">Gestion des produits</h1>
            <p className="text-[var(--text-secondary)]">{list.length} produits dans votre catalogue</p>
          </div>
          <div className="flex gap-3">
            <Link href="/vendeur"><Button variant="outline">Retour</Button></Link>
            <Button onClick={() => { resetForm(); setShowForm(true) }}>
              <Plus className="w-4 h-4" /> Ajouter un produit
            </Button>
          </div>
        </div>

        {showForm && (
          <AnimatedDiv fade slideUp className="mb-8 p-6 rounded-2xl bg-[var(--bg-primary)] border-2 border-[var(--border-hover)]/30 shadow-lg">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-[var(--text-primary)]">{editingId ? "Modifier le produit" : "Nouveau produit"}</h2>
              <button onClick={resetForm} className="p-2 rounded-xl hover:bg-[var(--bg-secondary)]"><X className="w-5 h-5 text-[var(--text-secondary)]" /></button>
            </div>
            <form onSubmit={handleSubmit} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="sm:col-span-2 lg:col-span-3">
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">Images du produit (galerie)</label>
                <div className="space-y-2">
                  {form.images.map((img, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="flex-1">
                        <div className="relative">
                          <input
                            type="file"
                            accept="image/png,image/jpeg,image/webp,image/svg+xml"
                            onChange={e => handleFileInput(e, i)}
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
                          <img src={img} alt="" className="w-full h-full object-cover" />
                        </div>
                      )}
                      {form.images.length > 1 && (
                        <button type="button" onClick={() => removeImage(i)} className="p-2 rounded-lg hover:bg-red-50 text-[var(--text-secondary)] hover:text-red-500 transition-colors shrink-0">
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <button type="button" onClick={addImage} className="mt-2 flex items-center gap-1.5 text-sm text-[var(--text-link)] font-medium hover:underline">
                  <ImagePlus className="w-4 h-4" /> Ajouter une image
                </button>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">Nom du produit</label>
                <Input placeholder="iPhone 16 Pro Max" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">Marque</label>
                <Input placeholder="Apple" value={form.brand} onChange={e => setForm(f => ({ ...f, brand: e.target.value }))} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">Catégorie</label>
                <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl border-2 border-[var(--border)] text-sm text-[var(--text-primary)] bg-[var(--bg-primary)] focus:border-[var(--border-hover)] focus:outline-none">
                  {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">Prix (F CFA)</label>
                <Input type="number" placeholder="1599000" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">Crédit (nombre de mois)</label>
                <Input type="number" placeholder="36" min="1" max="48" value={form.creditMonths} onChange={e => setForm(f => ({ ...f, creditMonths: e.target.value }))} />
                {form.price && Number(form.price) > 0 && Number(form.creditMonths) > 0 && (
                  <p className="mt-1 text-xs text-[var(--text-link)] font-medium">
                    Mensualité : <strong>{(Number(form.price) / Number(form.creditMonths)).toLocaleString("fr-FR", { maximumFractionDigits: 0 })} F/mois</strong>
                    <span className="text-[var(--text-secondary)]"> sur {form.creditMonths} mois</span>
                  </p>
                )}
              </div>
              <div className="sm:col-span-2 lg:col-span-3">
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">Taux d'intérêt par durée (%)</label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {creditDurations.map(d => (
                    <div key={d}>
                      <label className="block text-xs text-[var(--text-secondary)] mb-1">{d} mois</label>
                      <input
                        type="number" min="0" max="100"
                        value={rateInputs[String(d)]}
                        onChange={e => setRateInputs(r => ({ ...r, [String(d)]: e.target.value }))}
                        className="w-full px-3 py-2 rounded-xl border-2 border-[var(--border)] text-sm text-[var(--text-primary)] bg-[var(--bg-primary)] focus:border-[var(--border-hover)] focus:outline-none"
                        placeholder="0"
                      />
                    </div>
                  ))}
                </div>
              </div>
              <div className="sm:col-span-2 lg:col-span-3">
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">Description</label>
                <textarea
                  placeholder="Décrivez les caractéristiques, les avantages et les détails du produit..."
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  rows={4}
                  className="w-full px-4 py-2.5 rounded-xl border-2 border-[var(--border)] text-sm text-[var(--text-primary)] bg-[var(--bg-primary)] focus:border-[var(--border-hover)] focus:outline-none resize-none"
                />
              </div>
              <div className="flex items-end gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.inStock} onChange={e => setForm(f => ({ ...f, inStock: e.target.checked }))} className="w-4 h-4 text-[var(--text-link)] rounded" />
                  <span className="text-sm text-[var(--text-primary)]">En stock</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.promotion} onChange={e => setForm(f => ({ ...f, promotion: e.target.checked }))} className="w-4 h-4 text-[var(--text-link)] rounded" />
                  <span className="text-sm text-[var(--text-primary)]">En promotion</span>
                </label>
              </div>
              <div className="flex items-end gap-2">
                <Button type="submit" disabled={uploading}>{editingId ? "Enregistrer" : "Ajouter"}</Button>
                <Button type="button" variant="outline" onClick={resetForm}>Annuler</Button>
              </div>
            </form>
          </AnimatedDiv>
        )}

        <AnimatedDiv fade slideUp className="bg-[var(--bg-primary)] rounded-2xl border-2 border-[var(--border)] overflow-hidden">
          <div className="p-4 border-b-2 border-[var(--border)]">
            <div className="relative max-w-xs">
              <Input icon={<Search className="w-4 h-4" />} placeholder="Rechercher un produit..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[var(--bg-secondary)] text-[var(--text-secondary)] text-xs uppercase tracking-wider">
                  <th className="text-left px-6 py-4 font-semibold">Produit</th>
                  <th className="text-left px-6 py-4 font-semibold">Catégorie</th>
                  <th className="text-right px-6 py-4 font-semibold">Prix</th>
                  <th className="text-center px-6 py-4 font-semibold">Images</th>
                  <th className="text-center px-6 py-4 font-semibold">Stock</th>
                  <th className="text-center px-6 py-4 font-semibold">Promo</th>
                  <th className="text-right px-6 py-4 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB]">
                {filtered.length === 0 ? (
                  <tr><td colSpan={7} className="text-center py-12 text-[var(--text-secondary)]">Aucun produit trouvé</td></tr>
                ) : filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-[var(--bg-secondary)] transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-[var(--bg-secondary)] overflow-hidden shrink-0">
                          <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
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
                      <div className="flex items-center justify-center -space-x-1">
                        {p.images.slice(0, 3).map((img, i) => (
                          <div key={i} className="w-6 h-6 rounded border-2 border-[var(--bg-primary)] overflow-hidden">
                            <img src={img} alt="" className="w-full h-full object-cover" />
                          </div>
                        ))}
                        {p.images.length > 3 && (
                          <span className="text-[10px] text-[var(--text-secondary)] font-semibold ml-1">+{p.images.length - 3}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {p.inStock ? <Badge variant="stock">En stock</Badge> : <Badge variant="promo">Épuisé</Badge>}
                    </td>
                    <td className="px-6 py-4 text-center">{p.promotion ? <Check className="w-4 h-4 text-green-500 mx-auto" /> : <span className="text-[#D1D5DB]">&mdash;</span>}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => openEdit(p)} className="p-2 rounded-xl hover:bg-[var(--text-link)]/10 text-[var(--text-secondary)] hover:text-[var(--text-link)] transition-colors">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => setDeleteId(p.id)} className="p-2 rounded-xl hover:bg-red-50 text-[var(--text-secondary)] hover:text-red-500 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </AnimatedDiv>

        {deleteId && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
            <AnimatedDiv fade slideUp className="bg-[var(--bg-primary)] rounded-2xl p-6 max-w-sm w-full shadow-2xl">
              <div className="w-12 h-12 rounded-2xl bg-red-100 flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-[var(--text-primary)] text-center mb-2">Supprimer le produit ?</h3>
              <p className="text-sm text-[var(--text-secondary)] text-center mb-6">Cette action est irréversible.</p>
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setDeleteId(null)}>Annuler</Button>
                <button onClick={handleDelete} className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700 transition-colors">Supprimer</button>
              </div>
            </AnimatedDiv>
          </div>
        )}
      </div>
    </div>
  )
}

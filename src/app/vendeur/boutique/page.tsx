"use client"

import { useState, useEffect, useCallback } from "react"
import { Store, MapPin, Phone, Mail, Pencil, X, Save, AlertTriangle, CheckCircle, Loader2 } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import type { Country, City, District } from "@/data/delivery"
import type { Category } from "@/data/categories"
import Button from "@/components/ui/button"
import Input from "@/components/ui/input"
import { AnimatedDiv } from "@/lib/animations"

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

  useEffect(() => {
    fetchShop()
  }, [fetchShop])

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
      </div>
    </div>
  )
}

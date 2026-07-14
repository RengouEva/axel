"use client"

import { useState, useEffect } from "react"
import { Store, Save } from "lucide-react"
import Button from "@/components/ui/button"
import toast from "react-hot-toast"
import { useAuth } from "@/lib/auth-context"

export default function ShopPage() {
  const { getAuthHeaders } = useAuth()
  const [shop, setShop] = useState<any>(null)
  const [settings, setSettings] = useState<any>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name: "", description: "", phone: "", email: "", logo: "", coverImage: "" })
  const [hours, setHours] = useState<Record<string, { open: string; close: string }>>({})

  useEffect(() => {
    fetch("/api/vendeur/services-pro/shop/branding", { headers: getAuthHeaders() }).then(r => r.json())
      .then(d => {
        setShop(d.shop)
        setSettings(d.settings || {})
        if (d.shop) setForm({ name: d.shop.name || "", description: d.shop.description || "", phone: d.shop.phone || "", email: d.shop.email || "", logo: d.shop.logo || "", coverImage: d.shop.coverImage || "" })
        if (d.settings?.hours) setHours(d.settings.hours)
        setLoading(false)
      }).catch(() => setLoading(false))
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch("/api/vendeur/services-pro/shop/branding", {
        method: "PUT", headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({
          ...form, settings: {
            hours, deliveryPolicy: settings.deliveryPolicy, returnPolicy: settings.returnPolicy,
            socialLinks: settings.socialLinks, seoDescription: settings.seoDescription,
          },
        }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error); return }
      toast.success("Boutique mise à jour")
    } catch { toast.error("Erreur") } finally { setSaving(false) }
  }

  const days = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"]
  const dayKeys = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]

  if (loading) return <div className="w-full min-h-screen bg-[var(--bg-secondary)] flex items-center justify-center"><p className="text-[var(--text-secondary)]">Chargement...</p></div>

  return (
    <div className="w-full min-h-screen bg-[var(--bg-secondary)] p-6">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Store className="w-8 h-8 text-[var(--text-link)]" />
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">Gestion de la boutique</h1>
            <p className="text-sm text-[var(--text-secondary)]">Personnalisez votre boutique</p>
          </div>
        </div>

        <div className="bg-[var(--bg-primary)] rounded-2xl border-2 border-[var(--border)] p-6 space-y-4">
          <h2 className="font-bold text-[var(--text-primary)]">Informations générales</h2>
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">Nom de la boutique</label>
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="w-full rounded-xl border-2 border-[var(--border)] bg-[var(--bg-secondary)] px-4 py-3 text-sm text-[var(--text-primary)]" />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">Description</label>
            <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              className="w-full rounded-xl border-2 border-[var(--border)] bg-[var(--bg-secondary)] px-4 py-3 text-sm text-[var(--text-primary)]" rows={3} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">Téléphone</label>
              <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className="w-full rounded-xl border-2 border-[var(--border)] bg-[var(--bg-secondary)] px-4 py-3 text-sm text-[var(--text-primary)]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">Email</label>
              <input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className="w-full rounded-xl border-2 border-[var(--border)] bg-[var(--bg-secondary)] px-4 py-3 text-sm text-[var(--text-primary)]" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">URL du logo</label>
            <input value={form.logo} onChange={e => setForm(f => ({ ...f, logo: e.target.value }))} placeholder="/images/logo.png" className="w-full rounded-xl border-2 border-[var(--border)] bg-[var(--bg-secondary)] px-4 py-3 text-sm text-[var(--text-primary)]" />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">URL de la bannière</label>
            <input value={form.coverImage} onChange={e => setForm(f => ({ ...f, coverImage: e.target.value }))} placeholder="/images/banner.png" className="w-full rounded-xl border-2 border-[var(--border)] bg-[var(--bg-secondary)] px-4 py-3 text-sm text-[var(--text-primary)]" />
          </div>

          <h2 className="font-bold text-[var(--text-primary)] pt-4">Horaires d'ouverture</h2>
          {dayKeys.map((key, i) => (
            <div key={key} className="flex items-center gap-3">
              <span className="text-sm text-[var(--text-primary)] w-24">{days[i]}</span>
              <input type="time" value={hours[key]?.open || "09:00"} onChange={e => setHours(h => ({ ...h, [key]: { ...h[key], open: e.target.value } }))}
                className="rounded-xl border-2 border-[var(--border)] bg-[var(--bg-secondary)] px-3 py-2 text-sm text-[var(--text-primary)]" />
              <span className="text-[var(--text-secondary)]">à</span>
              <input type="time" value={hours[key]?.close || "18:00"} onChange={e => setHours(h => ({ ...h, [key]: { ...h[key], close: e.target.value } }))}
                className="rounded-xl border-2 border-[var(--border)] bg-[var(--bg-secondary)] px-3 py-2 text-sm text-[var(--text-primary)]" />
            </div>
          ))}

          <h2 className="font-bold text-[var(--text-primary)] pt-4">Politiques</h2>
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">Politique de livraison</label>
            <textarea value={settings.deliveryPolicy || ""} onChange={e => setSettings((s: any) => ({ ...s, deliveryPolicy: e.target.value }))}
              className="w-full rounded-xl border-2 border-[var(--border)] bg-[var(--bg-secondary)] px-4 py-3 text-sm text-[var(--text-primary)]" rows={3} />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">Politique de retour</label>
            <textarea value={settings.returnPolicy || ""} onChange={e => setSettings((s: any) => ({ ...s, returnPolicy: e.target.value }))}
              className="w-full rounded-xl border-2 border-[var(--border)] bg-[var(--bg-secondary)] px-4 py-3 text-sm text-[var(--text-primary)]" rows={3} />
          </div>

          <div className="pt-4">
            <Button onClick={handleSave} disabled={saving}><Save className="w-4 h-4" /> {saving ? "Enregistrement..." : "Enregistrer"}</Button>
          </div>
        </div>
      </div>
    </div>
  )
}

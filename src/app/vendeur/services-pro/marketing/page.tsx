"use client"

import { useState, useEffect } from "react"
import { Megaphone, Plus, Trash2, Loader2, Package } from "lucide-react"
import Button from "@/components/ui/button"
import Input from "@/components/ui/input"
import toast from "react-hot-toast"
import { useAuth } from "@/lib/auth-context"
import type { PromoCode, FlashSale, ProductPack, BogoOffer } from "@/lib/services-pro-types"

function EmptyState({ icon: Icon, title, description }: { icon: any; title: string; description: string }) {
  return (
    <div className="text-center py-12">
      <Icon className="w-12 h-12 mx-auto mb-4 text-[var(--text-muted)]" />
      <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-1">{title}</h3>
      <p className="text-sm text-[var(--text-secondary)]">{description}</p>
    </div>
  )
}

export default function MarketingPage() {
  const { getAuthHeaders } = useAuth()
  const [tab, setTab] = useState("promo")
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([])
  const [flashSales, setFlashSales] = useState<FlashSale[]>([])
  const [packs, setPacks] = useState<ProductPack[]>([])
  const [bogo, setBogo] = useState<BogoOffer[]>([])
  const [loading, setLoading] = useState(true)

  const loadData = async () => {
    setLoading(true)
    try {
      const [p, f, pk, b] = await Promise.all([
        fetch("/api/vendeur/services-pro/marketing/promo-codes", { headers: getAuthHeaders() }).then(async r => { if (!r.ok) { const err = await r.json(); toast.error(err.error || "Une erreur est survenue"); return { codes: [] } }; return r.json() }) as Promise<{ codes: PromoCode[] }>,
        fetch("/api/vendeur/services-pro/marketing/flash-sales", { headers: getAuthHeaders() }).then(async r => { if (!r.ok) { const err = await r.json(); toast.error(err.error || "Une erreur est survenue"); return { flashSales: [] } }; return r.json() }) as Promise<{ flashSales: FlashSale[] }>,
        fetch("/api/vendeur/services-pro/marketing/packs", { headers: getAuthHeaders() }).then(async r => { if (!r.ok) { const err = await r.json(); toast.error(err.error || "Une erreur est survenue"); return { packs: [] } }; return r.json() }) as Promise<{ packs: ProductPack[] }>,
        fetch("/api/vendeur/services-pro/marketing/bogo", { headers: getAuthHeaders() }).then(async r => { if (!r.ok) { const err = await r.json(); toast.error(err.error || "Une erreur est survenue"); return { offers: [] } }; return r.json() }) as Promise<{ offers: BogoOffer[] }>,
      ])
      setPromoCodes(p.codes || [])
      setFlashSales(f.flashSales || [])
      setPacks(pk.packs || [])
      setBogo(b.offers || [])
    } catch { toast.error("Une erreur est survenue") } finally { setLoading(false) }
  }

  useEffect(() => { loadData() }, [])

  const handleDelete = async (endpoint: string, id: string) => {
    const res = await fetch(`/api/vendeur/services-pro/marketing/${endpoint}?id=${id}`, { method: "DELETE", headers: getAuthHeaders() })
    if (!res.ok) { try { const d = await res.json(); toast.error(d.error || "Erreur") } catch { toast.error("Erreur") } return }
    toast.success("Élément supprimé")
    loadData()
  }

  const tabs = [
    { id: "promo", label: "Codes promo" },
    { id: "flash", label: "Ventes flash" },
    { id: "packs", label: "Packs produits" },
    { id: "bogo", label: "Offres BOGO" },
  ]

  if (loading) return <div className="w-full min-h-screen bg-[var(--bg-secondary)] flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin" style={{ color: "var(--text-link)" }} /></div>

  return (
    <div className="w-full min-h-screen bg-[var(--bg-secondary)] p-6">
      <div className="flex items-center gap-3 mb-6">
        <Megaphone className="w-8 h-8 text-[var(--text-link)]" />
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Outils marketing</h1>
          <p className="text-sm text-[var(--text-secondary)]">Promotions, ventes flash, packs et offres BOGO</p>
        </div>
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-xl text-sm font-medium ${tab === t.id ? "bg-[var(--text-link)] text-white" : "bg-[var(--bg-primary)] text-[var(--text-secondary)] border border-[var(--border)]"}`}>{t.label}</button>
        ))}
      </div>

      <div className="bg-[var(--bg-primary)] rounded-2xl border-2 border-[var(--border)] p-6">
        {tab === "promo" && <PromoCodeSection codes={promoCodes} onDelete={(id: string) => handleDelete("promo-codes", id)} />}
        {tab === "flash" && <FlashSaleSection sales={flashSales} onToggle={loadData} getAuthHeaders={getAuthHeaders} />}
        {tab === "packs" && <PacksSection packs={packs} onDelete={(id: string) => handleDelete("packs", id)} getAuthHeaders={getAuthHeaders} onUpdate={loadData} />}
        {tab === "bogo" && <BogoSection offers={bogo} onDelete={(id: string) => handleDelete("bogo", id)} getAuthHeaders={getAuthHeaders} onUpdate={loadData} />}
      </div>
    </div>
  )
}

function PromoCodeSection({ codes, onDelete }: { codes: PromoCode[]; onDelete: (id: string) => void }) {
  const { getAuthHeaders } = useAuth()
  const [form, setForm] = useState({ code: "", discountType: "percentage", discountValue: "", minPurchase: "0", maxUses: "0", startDate: "", endDate: "" })

  const create = async () => {
    const res = await fetch("/api/vendeur/services-pro/marketing/promo-codes", {
      method: "POST", headers: { "Content-Type": "application/json", ...getAuthHeaders() },
      body: JSON.stringify({ ...form, discountValue: parseInt(form.discountValue), minPurchase: parseInt(form.minPurchase), maxUses: parseInt(form.maxUses) }),
    })
    const d = await res.json()
    if (!res.ok) { toast.error(d.error); return }
    toast.success("Code promo créé")
    setForm({ code: "", discountType: "percentage", discountValue: "", minPurchase: "0", maxUses: "0", startDate: "", endDate: "" })
  }

  return (
    <div className="space-y-4">
      <h2 className="font-bold text-[var(--text-primary)]">Codes promotionnels</h2>
      <div className="grid grid-cols-2 gap-3">
        <input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))} placeholder="Code (ex: PROMO10)" className="rounded-xl border-2 border-[var(--border)] bg-[var(--bg-secondary)] px-4 py-3 text-sm text-[var(--text-primary)]" />
        <select value={form.discountType} onChange={e => setForm(f => ({ ...f, discountType: e.target.value }))} className="rounded-xl border-2 border-[var(--border)] bg-[var(--bg-secondary)] px-4 py-3 text-sm text-[var(--text-primary)]">
          <option value="percentage">Pourcentage</option>
          <option value="fixed">Montant fixe</option>
        </select>
        <input value={form.discountValue} onChange={e => setForm(f => ({ ...f, discountValue: e.target.value }))} placeholder="Valeur" type="number" className="rounded-xl border-2 border-[var(--border)] bg-[var(--bg-secondary)] px-4 py-3 text-sm text-[var(--text-primary)]" />
        <input value={form.minPurchase} onChange={e => setForm(f => ({ ...f, minPurchase: e.target.value }))} placeholder="Achat min" type="number" className="rounded-xl border-2 border-[var(--border)] bg-[var(--bg-secondary)] px-4 py-3 text-sm text-[var(--text-primary)]" />
        <input value={form.maxUses} onChange={e => setForm(f => ({ ...f, maxUses: e.target.value }))} placeholder="Utilisations max" type="number" className="rounded-xl border-2 border-[var(--border)] bg-[var(--bg-secondary)] px-4 py-3 text-sm text-[var(--text-primary)]" />
        <input type="datetime-local" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} className="rounded-xl border-2 border-[var(--border)] bg-[var(--bg-secondary)] px-4 py-3 text-sm text-[var(--text-primary)]" />
        <input type="datetime-local" value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} className="rounded-xl border-2 border-[var(--border)] bg-[var(--bg-secondary)] px-4 py-3 text-sm text-[var(--text-primary)]" />
      </div>
      <Button onClick={create}><Plus className="w-4 h-4" /> Créer le code</Button>

      <div className="space-y-2 mt-4">
        {codes.map((c: PromoCode) => (
          <div key={c.id} className="flex items-center justify-between p-3 rounded-xl bg-[var(--bg-secondary)] text-sm">
            <div>
              <span className="font-semibold text-[var(--text-primary)]">{c.code}</span>
              <span className="ml-2 text-[var(--text-secondary)]">{c.discountType === 'percentage' ? `${c.discountValue}%` : `${c.discountValue} F`} / {c.usedCount}/{c.maxUses || '∞'}</span>
            </div>
            <button onClick={() => onDelete(c.id)} className="text-red-400 hover:text-red-300"><Trash2 className="w-4 h-4" /></button>
          </div>
        ))}
      </div>
    </div>
  )
}

function FlashSaleSection({ sales, onToggle, getAuthHeaders }: { sales: FlashSale[]; onToggle: () => void; getAuthHeaders: () => Record<string, string> }) {
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: "", discountPercent: 10, startDate: "", endDate: "" })

  const create = async () => {
    const res = await fetch("/api/vendeur/services-pro/marketing/flash-sales", {
      method: "POST", headers: { "Content-Type": "application/json", ...getAuthHeaders() },
      body: JSON.stringify({ ...form, discountPercent: Number(form.discountPercent) }),
    })
    const d = await res.json()
    if (!res.ok) { toast.error(d.error); return }
    toast.success("Vente flash créée")
    setShowForm(false)
    setForm({ name: "", discountPercent: 10, startDate: "", endDate: "" })
    onToggle()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-[var(--text-primary)]">Ventes flash</h2>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[var(--text-link)]/10 text-[var(--text-link)] text-xs font-semibold"><Plus className="w-3 h-3" /> Nouvelle</button>
      </div>

      {showForm && (
        <div className="p-4 rounded-xl bg-[var(--bg-secondary)] space-y-3 border border-[var(--border)]">
          <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Nom de l'offre" className="w-full rounded-xl border-2 border-[var(--border)] bg-[var(--bg-primary)] px-4 py-2 text-sm text-[var(--text-primary)]" />
          <div>
            <label className="block text-xs text-[var(--text-secondary)] mb-1">Réduction: {form.discountPercent}%</label>
            <input type="range" min="0" max="100" value={form.discountPercent} onChange={e => setForm(f => ({ ...f, discountPercent: Number(e.target.value) }))} className="w-full accent-[var(--text-link)]" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input type="datetime-local" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} className="rounded-xl border-2 border-[var(--border)] bg-[var(--bg-primary)] px-4 py-2 text-sm text-[var(--text-primary)]" />
            <input type="datetime-local" value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} className="rounded-xl border-2 border-[var(--border)] bg-[var(--bg-primary)] px-4 py-2 text-sm text-[var(--text-primary)]" />
          </div>
          <Button onClick={create} size="sm"><Plus className="w-3 h-3" /> Créer</Button>
        </div>
      )}

      {sales.map((s: FlashSale) => (
        <div key={s.id} className="flex items-center justify-between p-3 rounded-xl bg-[var(--bg-secondary)] text-sm">
          <div>
            <span className="font-semibold text-[var(--text-primary)]">{s.name}</span>
            <span className="ml-2 text-[var(--text-secondary)]">-{s.discountPercent}%</span>
          </div>
          <button onClick={() => { fetch("/api/vendeur/services-pro/marketing/flash-sales", { method: "PUT", headers: { "Content-Type": "application/json", ...getAuthHeaders() }, body: JSON.stringify({ id: s.id, isActive: !s.isActive }) }).then(onToggle) }}
            className={`px-3 py-1 rounded-lg text-xs font-semibold ${s.isActive ? 'bg-green-500/10 text-green-400' : 'bg-gray-500/10 text-gray-400'}`}>
            {s.isActive ? 'Actif' : 'Inactif'}
          </button>
        </div>
      ))}
      {sales.length === 0 && !showForm && <EmptyState icon={Megaphone} title="Aucune vente flash" description="Il n'y a aucune vente flash pour le moment." />}
    </div>
  )
}

function PacksSection({ packs, onDelete, getAuthHeaders, onUpdate }: { packs: ProductPack[]; onDelete: (id: string) => void; getAuthHeaders: () => Record<string, string>; onUpdate: () => void }) {
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: "", products: "[]", packPrice: "", originalPrice: "", stock: "0" })

  const create = async () => {
    const res = await fetch("/api/vendeur/services-pro/marketing/packs", {
      method: "POST", headers: { "Content-Type": "application/json", ...getAuthHeaders() },
      body: JSON.stringify({ ...form, packPrice: Number(form.packPrice), originalPrice: Number(form.originalPrice), stock: Number(form.stock), products: JSON.parse(form.products || "[]") }),
    })
    const d = await res.json()
    if (!res.ok) { toast.error(d.error); return }
    toast.success("Pack créé")
    setShowForm(false)
    setForm({ name: "", products: "[]", packPrice: "", originalPrice: "", stock: "0" })
    onUpdate()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-[var(--text-primary)]">Packs de produits</h2>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[var(--text-link)]/10 text-[var(--text-link)] text-xs font-semibold"><Plus className="w-3 h-3" /> Nouveau pack</button>
      </div>

      {showForm && (
        <div className="p-4 rounded-xl bg-[var(--bg-secondary)] space-y-3 border border-[var(--border)]">
          <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Nom du pack" className="w-full rounded-xl border-2 border-[var(--border)] bg-[var(--bg-primary)] px-4 py-2 text-sm text-[var(--text-primary)]" />
          <input value={form.products} onChange={e => setForm(f => ({ ...f, products: e.target.value }))} placeholder='IDs produits JSON (ex: [1,2,3])' className="w-full rounded-xl border-2 border-[var(--border)] bg-[var(--bg-primary)] px-4 py-2 text-sm text-[var(--text-primary)]" />
          <div className="grid grid-cols-3 gap-3">
            <input value={form.packPrice} onChange={e => setForm(f => ({ ...f, packPrice: e.target.value }))} placeholder="Prix du pack" type="number" className="rounded-xl border-2 border-[var(--border)] bg-[var(--bg-primary)] px-4 py-2 text-sm text-[var(--text-primary)]" />
            <input value={form.originalPrice} onChange={e => setForm(f => ({ ...f, originalPrice: e.target.value }))} placeholder="Prix d'origine" type="number" className="rounded-xl border-2 border-[var(--border)] bg-[var(--bg-primary)] px-4 py-2 text-sm text-[var(--text-primary)]" />
            <input value={form.stock} onChange={e => setForm(f => ({ ...f, stock: e.target.value }))} placeholder="Stock" type="number" className="rounded-xl border-2 border-[var(--border)] bg-[var(--bg-primary)] px-4 py-2 text-sm text-[var(--text-primary)]" />
          </div>
          <Button onClick={create} size="sm"><Plus className="w-3 h-3" /> Créer</Button>
        </div>
      )}

      {packs.map((p: ProductPack) => (
        <div key={p.id} className="flex items-center justify-between p-3 rounded-xl bg-[var(--bg-secondary)] text-sm">
          <div>
            <span className="font-semibold text-[var(--text-primary)]">{p.name}</span>
            <span className="ml-2 text-[var(--text-secondary)]">{Number(p.packPrice).toLocaleString("fr-FR")} F</span>
          </div>
          <button onClick={() => onDelete(p.id)} className="text-red-400 hover:text-red-300"><Trash2 className="w-4 h-4" /></button>
        </div>
      ))}
      {packs.length === 0 && !showForm && <EmptyState icon={Package} title="Aucun pack" description="Il n'y a aucun pack produit pour le moment." />}
    </div>
  )
}

function BogoSection({ offers, onDelete, getAuthHeaders, onUpdate }: { offers: BogoOffer[]; onDelete: (id: string) => void; getAuthHeaders: () => Record<string, string>; onUpdate: () => void }) {
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: "", buyQuantity: 1, getQuantity: 1, discountPercent: 0, startDate: "", endDate: "" })

  const create = async () => {
    const res = await fetch("/api/vendeur/services-pro/marketing/bogo", {
      method: "POST", headers: { "Content-Type": "application/json", ...getAuthHeaders() },
      body: JSON.stringify({ ...form, buyQuantity: Number(form.buyQuantity), getQuantity: Number(form.getQuantity), discountPercent: Number(form.discountPercent) }),
    })
    const d = await res.json()
    if (!res.ok) { toast.error(d.error); return }
    toast.success("Offre BOGO créée")
    setShowForm(false)
    setForm({ name: "", buyQuantity: 1, getQuantity: 1, discountPercent: 0, startDate: "", endDate: "" })
    onUpdate()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-[var(--text-primary)]">Offres "Achetez X, obtenez Y"</h2>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[var(--text-link)]/10 text-[var(--text-link)] text-xs font-semibold"><Plus className="w-3 h-3" /> Nouvelle offre</button>
      </div>

      {showForm && (
        <div className="p-4 rounded-xl bg-[var(--bg-secondary)] space-y-3 border border-[var(--border)]">
          <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Nom de l'offre" className="w-full rounded-xl border-2 border-[var(--border)] bg-[var(--bg-primary)] px-4 py-2 text-sm text-[var(--text-primary)]" />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-[var(--text-secondary)] mb-1">Acheter (quantité)</label>
              <input type="number" min="1" value={form.buyQuantity} onChange={e => setForm(f => ({ ...f, buyQuantity: Number(e.target.value) }))} className="w-full rounded-xl border-2 border-[var(--border)] bg-[var(--bg-primary)] px-4 py-2 text-sm text-[var(--text-primary)]" />
            </div>
            <div>
              <label className="block text-xs text-[var(--text-secondary)] mb-1">Obtenir (quantité)</label>
              <input type="number" min="1" value={form.getQuantity} onChange={e => setForm(f => ({ ...f, getQuantity: Number(e.target.value) }))} className="w-full rounded-xl border-2 border-[var(--border)] bg-[var(--bg-primary)] px-4 py-2 text-sm text-[var(--text-primary)]" />
            </div>
          </div>
          <div>
            <label className="block text-xs text-[var(--text-secondary)] mb-1">Réduction: {form.discountPercent}%</label>
            <input type="range" min="0" max="100" value={form.discountPercent} onChange={e => setForm(f => ({ ...f, discountPercent: Number(e.target.value) }))} className="w-full accent-[var(--text-link)]" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input type="datetime-local" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} className="rounded-xl border-2 border-[var(--border)] bg-[var(--bg-primary)] px-4 py-2 text-sm text-[var(--text-primary)]" />
            <input type="datetime-local" value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} className="rounded-xl border-2 border-[var(--border)] bg-[var(--bg-primary)] px-4 py-2 text-sm text-[var(--text-primary)]" />
          </div>
          <Button onClick={create} size="sm"><Plus className="w-3 h-3" /> Créer</Button>
        </div>
      )}

      {offers.map((o: BogoOffer) => (
        <div key={o.id} className="flex items-center justify-between p-3 rounded-xl bg-[var(--bg-secondary)] text-sm">
          <div>
            <span className="font-semibold text-[var(--text-primary)]">{o.name}</span>
            <span className="ml-2 text-[var(--text-secondary)]">{o.buyQuantity} acheté(s) → {o.getQuantity} offert(s)</span>
          </div>
          <button onClick={() => onDelete(o.id)} className="text-red-400 hover:text-red-300"><Trash2 className="w-4 h-4" /></button>
        </div>
      ))}
      {offers.length === 0 && !showForm && <EmptyState icon={Megaphone} title="Aucune offre BOGO" description="Il n'y a aucune offre BOGO pour le moment." />}
    </div>
  )
}

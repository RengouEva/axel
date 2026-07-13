"use client"

import { useState, useEffect } from "react"
import { Megaphone, Plus, Trash2 } from "lucide-react"
import Button from "@/components/ui/button"
import Input from "@/components/ui/input"
import toast from "react-hot-toast"

export default function MarketingPage() {
  const [tab, setTab] = useState("promo")
  const [promoCodes, setPromoCodes] = useState<any[]>([])
  const [flashSales, setFlashSales] = useState<any[]>([])
  const [packs, setPacks] = useState<any[]>([])
  const [bogo, setBogo] = useState<any[]>([])

  const loadData = async () => {
    const [p, f, pk, b] = await Promise.all([
      fetch("/api/vendeur/services-pro/marketing/promo-codes").then(r => r.json()),
      fetch("/api/vendeur/services-pro/marketing/flash-sales").then(r => r.json()),
      fetch("/api/vendeur/services-pro/marketing/packs").then(r => r.json()),
      fetch("/api/vendeur/services-pro/marketing/bogo").then(r => r.json()),
    ])
    setPromoCodes(p.codes || [])
    setFlashSales(f.flashSales || [])
    setPacks(pk.packs || [])
    setBogo(b.offers || [])
  }

  useEffect(() => { loadData() }, [])

  const handleDelete = async (endpoint: string, id: string) => {
    await fetch(`/api/vendeur/services-pro/marketing/${endpoint}?id=${id}`, { method: "DELETE" })
    toast.success("Élément supprimé")
    loadData()
  }

  const tabs = [
    { id: "promo", label: "Codes promo" },
    { id: "flash", label: "Ventes flash" },
    { id: "packs", label: "Packs produits" },
    { id: "bogo", label: "Offres BOGO" },
  ]

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
        {tab === "flash" && <FlashSaleSection sales={flashSales} onToggle={loadData} />}
        {tab === "packs" && <PacksSection packs={packs} onDelete={(id: string) => handleDelete("packs", id)} />}
        {tab === "bogo" && <BogoSection offers={bogo} onDelete={(id: string) => handleDelete("bogo", id)} />}
      </div>
    </div>
  )
}

function PromoCodeSection({ codes, onDelete }: { codes: any[]; onDelete: (id: string) => void }) {
  const [form, setForm] = useState({ code: "", discountType: "percentage", discountValue: "", minPurchase: "0", maxUses: "0", startDate: "", endDate: "" })

  const create = async () => {
    const res = await fetch("/api/vendeur/services-pro/marketing/promo-codes", {
      method: "POST", headers: { "Content-Type": "application/json" },
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
        {codes.map((c: any) => (
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

function FlashSaleSection({ sales, onToggle }: { sales: any[]; onToggle: () => void }) {
  return (
    <div className="space-y-4">
      <h2 className="font-bold text-[var(--text-primary)]">Ventes flash</h2>
      {sales.map((s: any) => (
        <div key={s.id} className="flex items-center justify-between p-3 rounded-xl bg-[var(--bg-secondary)] text-sm">
          <div>
            <span className="font-semibold text-[var(--text-primary)]">{s.name}</span>
            <span className="ml-2 text-[var(--text-secondary)]">-{s.discountPercent}%</span>
          </div>
          <button onClick={() => { fetch("/api/vendeur/services-pro/marketing/flash-sales", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: s.id, isActive: !s.isActive }) }).then(onToggle) }}
            className={`px-3 py-1 rounded-lg text-xs font-semibold ${s.isActive ? 'bg-green-500/10 text-green-400' : 'bg-gray-500/10 text-gray-400'}`}>
            {s.isActive ? 'Actif' : 'Inactif'}
          </button>
        </div>
      ))}
    </div>
  )
}

function PacksSection({ packs, onDelete }: { packs: any[]; onDelete: (id: string) => void }) {
  return (
    <div className="space-y-4">
      <h2 className="font-bold text-[var(--text-primary)]">Packs de produits</h2>
      {packs.map((p: any) => (
        <div key={p.id} className="flex items-center justify-between p-3 rounded-xl bg-[var(--bg-secondary)] text-sm">
          <div>
            <span className="font-semibold text-[var(--text-primary)]">{p.name}</span>
            <span className="ml-2 text-[var(--text-secondary)]">{Number(p.packPrice).toLocaleString("fr-FR")} F</span>
          </div>
          <button onClick={() => onDelete(p.id)} className="text-red-400 hover:text-red-300"><Trash2 className="w-4 h-4" /></button>
        </div>
      ))}
    </div>
  )
}

function BogoSection({ offers, onDelete }: { offers: any[]; onDelete: (id: string) => void }) {
  return (
    <div className="space-y-4">
      <h2 className="font-bold text-[var(--text-primary)]">Offres &quot;Achetez X, obtenez Y&quot;</h2>
      {offers.map((o: any) => (
        <div key={o.id} className="flex items-center justify-between p-3 rounded-xl bg-[var(--bg-secondary)] text-sm">
          <div>
            <span className="font-semibold text-[var(--text-primary)]">{o.name}</span>
            <span className="ml-2 text-[var(--text-secondary)]">{o.buyQuantity} acheté(s) → {o.getQuantity} offert(s)</span>
          </div>
          <button onClick={() => onDelete(o.id)} className="text-red-400 hover:text-red-300"><Trash2 className="w-4 h-4" /></button>
        </div>
      ))}
    </div>
  )
}

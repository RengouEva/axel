"use client"

import { useState, useEffect } from "react"
import { Package, Upload, Copy, Bell, Calendar, GitBranch, Download } from "lucide-react"
import Button from "@/components/ui/button"
import toast from "react-hot-toast"

export default function ProductsPage() {
  const [tab, setTab] = useState("import")
  const [importData, setImportData] = useState("")
  const [variants, setVariants] = useState<any[]>([])
  const [productId, setProductId] = useState("")
  const [variantForm, setVariantForm] = useState({ name: "", value: "", sku: "", price: "", stock: "0" })
  const [scheduleDate, setScheduleDate] = useState("")
  const [scheduleProductId, setScheduleProductId] = useState("")
  const [alertProductId, setAlertProductId] = useState("")
  const [alertThreshold, setAlertThreshold] = useState("5")

  const handleImport = async () => {
    try {
      const products = importData.split("\n").filter(l => l.trim()).map(line => {
        const cols = line.split(",")
        return { name: cols[0]?.trim(), price: cols[1]?.trim(), brand: cols[2]?.trim(), category: cols[3]?.trim() }
      })
      const res = await fetch("/api/vendeur/services-pro/products/import", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ products, format: "csv" }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error); return }
      toast.success(data.message)
      if (data.errors) data.errors.forEach((e: string) => toast.error(e))
    } catch { toast.error("Erreur lors de l'import") }
  }

  const handleDuplicate = async () => {
    if (!productId) { toast.error("ID produit requis"); return }
    try {
      const res = await fetch("/api/vendeur/services-pro/products/duplicate", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: parseInt(productId) }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error); return }
      toast.success(data.message)
    } catch { toast.error("Erreur") }
  }

  const addVariant = async () => {
    if (!productId || !variantForm.name || !variantForm.value) { toast.error("Champs requis"); return }
    try {
      const res = await fetch("/api/vendeur/services-pro/products/variants", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...variantForm, productId: parseInt(productId), price: variantForm.price ? parseInt(variantForm.price) : undefined, stock: parseInt(variantForm.stock) }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error); return }
      toast.success("Variante ajoutée")
      loadVariants()
    } catch { toast.error("Erreur") }
  }

  const loadVariants = async () => {
    if (!productId) return
    const res = await fetch(`/api/vendeur/services-pro/products/variants?productId=${productId}`)
    const data = await res.json()
    setVariants(data.variants || [])
  }

  const handleSchedule = async () => {
    if (!scheduleProductId || !scheduleDate) { toast.error("Champs requis"); return }
    try {
      const res = await fetch("/api/vendeur/services-pro/products/schedule", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: parseInt(scheduleProductId), scheduledAt: scheduleDate }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error); return }
      toast.success("Publication programmée")
    } catch { toast.error("Erreur") }
  }

  const handleStockAlert = async () => {
    if (!alertProductId || !alertThreshold) { toast.error("Champs requis"); return }
    try {
      const res = await fetch("/api/vendeur/services-pro/products/stock-alerts", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: parseInt(alertProductId), threshold: parseInt(alertThreshold) }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error); return }
      toast.success("Alerte configurée")
    } catch { toast.error("Erreur") }
  }

  const tabs = [
    { id: "import", label: "Import CSV", icon: Upload },
    { id: "duplicate", label: "Duplication", icon: Copy },
    { id: "variants", label: "Variantes", icon: GitBranch },
    { id: "schedule", label: "Programmation", icon: Calendar },
    { id: "stock", label: "Alertes stock", icon: Bell },
  ]

  return (
    <div className="w-full min-h-screen bg-[var(--bg-secondary)] p-6">
      <div className="flex items-center gap-3 mb-6">
        <Package className="w-8 h-8 text-[var(--text-link)]" />
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Gestion avancée des produits</h1>
          <p className="text-sm text-[var(--text-secondary)]">Import, duplication, variantes, stocks et programmation</p>
        </div>
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        {tabs.map(t => {
          const Icon = t.icon
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${tab === t.id ? "bg-[var(--text-link)] text-white" : "bg-[var(--bg-primary)] text-[var(--text-secondary)] border border-[var(--border)]"}`}>
              <Icon className="w-4 h-4" /> {t.label}
            </button>
          )
        })}
      </div>

      <div className="bg-[var(--bg-primary)] rounded-2xl border-2 border-[var(--border)] p-6">
        {tab === "import" && (
          <div className="space-y-4">
            <h2 className="font-bold text-[var(--text-primary)]">Import de produits (CSV)</h2>
            <p className="text-sm text-[var(--text-secondary)]">Format: nom,prix,marque,catégorie (une ligne par produit)</p>
            <textarea value={importData} onChange={e => setImportData(e.target.value)}
              className="w-full h-40 rounded-xl border-2 border-[var(--border)] bg-[var(--bg-secondary)] p-4 text-sm text-[var(--text-primary)]"
              placeholder={`Téléphone X,150000,Samsung,Téléphones\nOrdinateur Y,450000,Dell,Ordinateurs`} />
            <Button onClick={handleImport}><Upload className="w-4 h-4" /> Importer</Button>
          </div>
        )}

        {tab === "duplicate" && (
          <div className="space-y-4 max-w-md">
            <h2 className="font-bold text-[var(--text-primary)]">Dupliquer un produit</h2>
            <input value={productId} onChange={e => setProductId(e.target.value)} placeholder="ID du produit" className="w-full rounded-xl border-2 border-[var(--border)] bg-[var(--bg-secondary)] px-4 py-3 text-sm text-[var(--text-primary)]" />
            <Button onClick={handleDuplicate}><Copy className="w-4 h-4" /> Dupliquer</Button>
          </div>
        )}

        {tab === "variants" && (
          <div className="space-y-4 max-w-md">
            <h2 className="font-bold text-[var(--text-primary)]">Gérer les variantes</h2>
            <input value={productId} onChange={e => setProductId(e.target.value)} placeholder="ID du produit" className="w-full rounded-xl border-2 border-[var(--border)] bg-[var(--bg-secondary)] px-4 py-3 text-sm text-[var(--text-primary)]" />
            <button onClick={loadVariants} className="text-sm text-[var(--text-link)]">Charger les variantes</button>
            {variants.length > 0 && (
              <div className="space-y-2">
                {variants.map((v: any) => (
                  <div key={v.id} className="flex items-center justify-between p-3 rounded-xl bg-[var(--bg-secondary)] text-sm">
                    <span className="text-[var(--text-primary)]">{v.name}: {v.value}</span>
                    <span className="text-[var(--text-secondary)]">Stock: {v.stock}</span>
                  </div>
                ))}
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <input value={variantForm.name} onChange={e => setVariantForm(f => ({ ...f, name: e.target.value }))} placeholder="Type (Taille, Couleur...)" className="rounded-xl border-2 border-[var(--border)] bg-[var(--bg-secondary)] px-4 py-3 text-sm text-[var(--text-primary)]" />
              <input value={variantForm.value} onChange={e => setVariantForm(f => ({ ...f, value: e.target.value }))} placeholder="Valeur (M, Rouge...)" className="rounded-xl border-2 border-[var(--border)] bg-[var(--bg-secondary)] px-4 py-3 text-sm text-[var(--text-primary)]" />
              <input value={variantForm.sku} onChange={e => setVariantForm(f => ({ ...f, sku: e.target.value }))} placeholder="SKU" className="rounded-xl border-2 border-[var(--border)] bg-[var(--bg-secondary)] px-4 py-3 text-sm text-[var(--text-primary)]" />
              <input value={variantForm.price} onChange={e => setVariantForm(f => ({ ...f, price: e.target.value }))} placeholder="Prix (optionnel)" type="number" className="rounded-xl border-2 border-[var(--border)] bg-[var(--bg-secondary)] px-4 py-3 text-sm text-[var(--text-primary)]" />
              <input value={variantForm.stock} onChange={e => setVariantForm(f => ({ ...f, stock: e.target.value }))} placeholder="Stock" type="number" className="rounded-xl border-2 border-[var(--border)] bg-[var(--bg-secondary)] px-4 py-3 text-sm text-[var(--text-primary)]" />
            </div>
            <Button onClick={addVariant}><GitBranch className="w-4 h-4" /> Ajouter la variante</Button>
          </div>
        )}

        {tab === "schedule" && (
          <div className="space-y-4 max-w-md">
            <h2 className="font-bold text-[var(--text-primary)]">Publication programmée</h2>
            <input value={scheduleProductId} onChange={e => setScheduleProductId(e.target.value)} placeholder="ID du produit" className="w-full rounded-xl border-2 border-[var(--border)] bg-[var(--bg-secondary)] px-4 py-3 text-sm text-[var(--text-primary)]" />
            <input type="datetime-local" value={scheduleDate} onChange={e => setScheduleDate(e.target.value)} className="w-full rounded-xl border-2 border-[var(--border)] bg-[var(--bg-secondary)] px-4 py-3 text-sm text-[var(--text-primary)]" />
            <Button onClick={handleSchedule}><Calendar className="w-4 h-4" /> Programmer</Button>
          </div>
        )}

        {tab === "stock" && (
          <div className="space-y-4 max-w-md">
            <h2 className="font-bold text-[var(--text-primary)]">Alertes de stock faible</h2>
            <input value={alertProductId} onChange={e => setAlertProductId(e.target.value)} placeholder="ID du produit" className="w-full rounded-xl border-2 border-[var(--border)] bg-[var(--bg-secondary)] px-4 py-3 text-sm text-[var(--text-primary)]" />
            <input value={alertThreshold} onChange={e => setAlertThreshold(e.target.value)} placeholder="Seuil d'alerte" type="number" className="w-full rounded-xl border-2 border-[var(--border)] bg-[var(--bg-secondary)] px-4 py-3 text-sm text-[var(--text-primary)]" />
            <Button onClick={handleStockAlert}><Bell className="w-4 h-4" /> Configurer l'alerte</Button>
          </div>
        )}
      </div>
    </div>
  )
}

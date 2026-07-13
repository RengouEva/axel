"use client"

import { useState, useEffect } from "react"
import { Key, Plus, Trash2, Copy, Eye, EyeOff } from "lucide-react"
import Button from "@/components/ui/button"
import toast from "react-hot-toast"

export default function ApiPage() {
  const [keys, setKeys] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [newKey, setNewKey] = useState<{ rawKey: string; name: string } | null>(null)
  const [form, setForm] = useState({ name: "", permissions: ["products:read"] as string[], rateLimit: "100" })

  const loadKeys = async () => {
    const res = await fetch("/api/vendeur/services-pro/api-keys").then(r => r.json())
    setKeys(res.keys || [])
    setLoading(false)
  }

  useEffect(() => { loadKeys() }, [])

  const createKey = async () => {
    const res = await fetch("/api/vendeur/services-pro/api-keys", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, rateLimit: parseInt(form.rateLimit) }),
    })
    const data = await res.json()
    if (!res.ok) { toast.error(data.error); return }
    setNewKey({ rawKey: data.rawKey, name: data.key.name })
    toast.success("Clé API créée")
    loadKeys()
  }

  const deleteKey = async (id: string) => {
    await fetch(`/api/vendeur/services-pro/api-keys?id=${id}`, { method: "DELETE" })
    toast.success("Clé supprimée")
    loadKeys()
  }

  const copyKey = (key: string) => {
    navigator.clipboard.writeText(key).then(() => toast.success("Clé copiée"))
  }

  const allPermissions = ["products:read", "products:write", "orders:read", "orders:write", "shop:read", "shop:write", "marketing:read", "marketing:write", "reports:read"]

  if (loading) return <div className="w-full min-h-screen bg-[var(--bg-secondary)] flex items-center justify-center"><p className="text-[var(--text-secondary)]">Chargement...</p></div>

  return (
    <div className="w-full min-h-screen bg-[var(--bg-secondary)] p-6">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Key className="w-8 h-8 text-[var(--text-link)]" />
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">API</h1>
            <p className="text-sm text-[var(--text-secondary)]">Connectez vos ERP, CRM et logiciels</p>
          </div>
        </div>

        {newKey && (
          <div className="p-6 rounded-2xl bg-yellow-500/10 border-2 border-yellow-500/20 mb-6">
            <h3 className="font-bold text-yellow-400 mb-2">🔑 Clé API créée : {newKey.name}</h3>
            <div className="flex items-center gap-2 bg-[var(--bg-secondary)] p-3 rounded-xl mb-2">
              <code className="text-sm text-[var(--text-primary)] flex-1 break-all">{newKey.rawKey}</code>
              <button onClick={() => copyKey(newKey.rawKey)} className="text-[var(--text-link)]"><Copy className="w-4 h-4" /></button>
            </div>
            <p className="text-xs text-yellow-400">Conservez cette clé précieusement. Elle ne sera plus jamais affichée.</p>
          </div>
        )}

        <div className="bg-[var(--bg-primary)] rounded-2xl border-2 border-[var(--border)] p-6 space-y-4 mb-6">
          <h2 className="font-bold text-[var(--text-primary)]">Créer une nouvelle clé</h2>
          <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Nom (ex: ERP Entreprise)" className="w-full rounded-xl border-2 border-[var(--border)] bg-[var(--bg-secondary)] px-4 py-3 text-sm text-[var(--text-primary)]" />
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">Permissions</label>
            <div className="flex flex-wrap gap-2">
              {allPermissions.map(p => (
                <label key={p} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--bg-secondary)] text-xs text-[var(--text-primary)] cursor-pointer">
                  <input type="checkbox" checked={form.permissions.includes(p)} onChange={e => {
                    setForm(f => ({ ...f, permissions: e.target.checked ? [...f.permissions, p] : f.permissions.filter(x => x !== p) }))
                  }} className="accent-[var(--text-link)]" />
                  {p}
                </label>
              ))}
            </div>
          </div>
          <input value={form.rateLimit} onChange={e => setForm(f => ({ ...f, rateLimit: e.target.value }))} placeholder="Limite (requêtes/min)" type="number" className="w-full rounded-xl border-2 border-[var(--border)] bg-[var(--bg-secondary)] px-4 py-3 text-sm text-[var(--text-primary)]" />
          <Button onClick={createKey}><Plus className="w-4 h-4" /> Créer la clé</Button>
        </div>

        <div className="bg-[var(--bg-primary)] rounded-2xl border-2 border-[var(--border)] p-6">
          <h2 className="font-bold text-[var(--text-primary)] mb-4">Clés existantes</h2>
          <div className="space-y-3">
            {keys.map((k: any) => (
              <div key={k.id} className="flex items-center justify-between p-4 rounded-xl bg-[var(--bg-secondary)]">
                <div>
                  <p className="font-semibold text-sm text-[var(--text-primary)]">{k.name}</p>
                  <p className="text-xs text-[var(--text-secondary)]">{k.keyPrefix}... • {k.permissions?.length || 0} permissions</p>
                  <p className="text-xs text-[var(--text-muted)]">{k.lastUsedAt ? `Dernière utilisation: ${new Date(k.lastUsedAt).toLocaleDateString("fr-FR")}` : "Jamais utilisé"}</p>
                </div>
                <button onClick={() => deleteKey(k.id)} className="text-red-400 hover:text-red-300"><Trash2 className="w-4 h-4" /></button>
              </div>
            ))}
            {keys.length === 0 && <p className="text-sm text-[var(--text-secondary)] text-center py-4">Aucune clé API</p>}
          </div>
        </div>
      </div>
    </div>
  )
}

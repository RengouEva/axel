"use client"

import { useState, useEffect } from "react"
import { Loader2, ToggleLeft, ToggleRight, Euro } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import Button from "@/components/ui/button"
import { AD_SLOT_LABELS } from "@/lib/ads"

export default function AdminPlacementsPage() {
  const { getAuthHeaders } = useAuth()
  const [placements, setPlacements] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)

  useEffect(() => {
    fetch("/api/ads/placements", { headers: getAuthHeaders() })
      .then(r => r.json())
      .then(d => setPlacements(d.placements || []))
      .finally(() => setLoading(false))
  }, [getAuthHeaders])

  const handleToggle = async (id: string, field: string, value: boolean) => {
    setSaving(id)
    try {
      await fetch("/api/ads/placements", {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({ id, [field]: value }),
      })
      setPlacements(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p))
    } catch {}
    setSaving(null)
  }

  const handlePriceChange = async (id: string, basePrice: number) => {
    setSaving(id)
    try {
      await fetch("/api/ads/placements", {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({ id, basePrice }),
      })
      setPlacements(prev => prev.map(p => p.id === id ? { ...p, basePrice } : p))
    } catch {}
    setSaving(null)
  }

  if (loading) return <div className="p-8 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-[var(--text-link)]" /></div>

  return (
    <div className="p-4 lg:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Emplacements sponsorisés</h1>
        <p className="text-sm text-[var(--text-secondary)]">Gérez les emplacements publicitaires</p>
      </div>

      <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[var(--bg-elevated)] text-[var(--text-secondary)] text-xs uppercase">
                <th className="text-left px-6 py-4">Emplacement</th>
                <th className="text-left px-6 py-4">Slot</th>
                <th className="text-center px-6 py-4">Prix de base</th>
                <th className="text-center px-6 py-4">Enchères</th>
                <th className="text-center px-6 py-4">Actif</th>
                <th className="text-center px-6 py-4">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {placements.map((p) => (
                <tr key={p.id} className="hover:bg-[var(--bg-elevated)] transition-colors">
                  <td className="px-6 py-4">
                    <span className="font-semibold text-[var(--text-primary)]">{p.name}</span>
                    <p className="text-xs text-[var(--text-secondary)]">{p.description}</p>
                  </td>
                  <td className="px-6 py-4">
                    <code className="px-2 py-1 rounded bg-[var(--bg-elevated)] text-xs text-[var(--text-primary)]">{p.slot}</code>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <input
                        type="number"
                        defaultValue={p.basePrice}
                        onBlur={e => handlePriceChange(p.id, Number(e.target.value))}
                        className="w-24 px-2 py-1 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)] text-sm text-center text-[var(--text-primary)]"
                      />
                      <span className="text-xs text-[var(--text-secondary)]">F</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => handleToggle(p.id, "auctionEnabled", !p.auctionEnabled)}
                      disabled={saving === p.id}
                      className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${
                        p.auctionEnabled ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {p.auctionEnabled ? "Oui" : "Non"}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => handleToggle(p.id, "isActive", !p.isActive)}
                      disabled={saving === p.id}
                      className={p.isActive ? "text-green-500" : "text-[var(--text-muted)]"}
                    >
                      {p.isActive ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-center">
                    {saving === p.id && <Loader2 className="w-4 h-4 animate-spin mx-auto text-[var(--text-link)]" />}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

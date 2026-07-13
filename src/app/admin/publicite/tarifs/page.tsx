"use client"

import { useState, useEffect } from "react"
import { Loader2, Euro, Info } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { AD_SLOT_LABELS, SLOT_DIMENSIONS } from "@/lib/ads"

export default function AdminPricingPage() {
  const { getAuthHeaders } = useAuth()
  const [placements, setPlacements] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/ads/placements", { headers: getAuthHeaders() })
      .then(r => r.json())
      .then(d => setPlacements(d.placements || []))
      .finally(() => setLoading(false))
  }, [getAuthHeaders])

  if (loading) return <div className="p-8 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-[var(--text-link)]" /></div>

  return (
    <div className="p-4 lg:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Tarifs publicitaires</h1>
        <p className="text-sm text-[var(--text-secondary)]">Grille tarifaire des emplacements sponsorisés</p>
      </div>

      <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-4 flex items-start gap-3">
        <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="text-sm text-amber-800">
          <p className="font-semibold">Tarifs indicatifs</p>
          <p className="text-amber-700">Les prix de base sont configurables. Les emplacements aux enchères permettent aux annonceurs de surenchérir.</p>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {placements.map((p) => {
          const dims = SLOT_DIMENSIONS[p.slot]
          return (
            <div key={p.id} className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border)]">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-[var(--text-primary)]">{p.name}</h3>
                <code className="px-2 py-0.5 rounded bg-[var(--bg-elevated)] text-[10px] text-[var(--text-secondary)]">{p.slot}</code>
              </div>
              {dims && (
                <p className="text-xs text-[var(--text-muted)] mb-3">Format: {dims.label}</p>
              )}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-[var(--text-secondary)]">Prix de base</p>
                  <p className="text-2xl font-black text-[var(--text-primary)]">{p.basePrice.toLocaleString("fr-FR")} <span className="text-sm font-semibold text-[var(--text-secondary)]">F</span></p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-[var(--text-secondary)]">Enchères</p>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${
                    p.auctionEnabled ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                  }`}>
                    {p.auctionEnabled ? "Activées" : "Désactivées"}
                  </span>
                </div>
              </div>
              {p.auctionEnabled && (
                <p className="text-xs text-[var(--text-muted)] mt-3">
                  L&apos;enchère minimum correspond au prix de base
                </p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

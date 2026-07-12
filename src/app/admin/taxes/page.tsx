"use client"

import { useState, useEffect } from "react"
import { DollarSign, Save, Percent, Globe, Plus, Trash2 } from "lucide-react"
import Button from "@/components/ui/button"
import Input from "@/components/ui/input"
import { useAuth } from "@/lib/auth-context"
import type { Country } from "@/data/delivery"
import type { TaxRate } from "@/data/taxes"
import Link from "next/link"

export default function AdminTaxesPage() {
  const { user } = useAuth()
  const [rates, setRates] = useState<TaxRate[]>([])
  const [saved, setSaved] = useState(false)
  const [newCountryId, setNewCountryId] = useState("")
  const [countries, setCountries] = useState<Country[]>([])

  useEffect(() => {
    Promise.all([
      fetch("/api/taxes").then(r => r.json()),
      fetch("/api/locations").then(r => r.json()),
    ]).then(([taxData, locData]) => {
      setRates(taxData.rates || [])
      setCountries(locData.countries || [])
    })
  }, [])

  if (!user || user.role !== "admin") {
    return <div className="flex items-center justify-center h-64"><p className="text-[var(--text-secondary)]">Chargement...</p></div>
  }

  const updateRate = (countryId: string, rate: number) => {
    setRates((prev) => prev.map((r) => r.countryId === countryId ? { ...r, rate } : r))
  }

  const addCountry = () => {
    if (!newCountryId || rates.find((r) => r.countryId === newCountryId)) return
    const country = countries.find((c) => c.id === newCountryId)
    if (!country) return
    setRates((prev) => [...prev, { countryId: newCountryId, rate: 19.25, label: `TVA ${country.name}` }])
    setNewCountryId("")
  }

  const removeRate = (countryId: string) => {
    setRates((prev) => prev.filter((r) => r.countryId !== countryId))
  }

  const handleSave = async () => {
    await fetch("/api/taxes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "save", rates }),
    })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleReset = async () => {
    const res = await fetch("/api/taxes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "reset" }),
    })
    const data = await res.json()
    if (data.rates) setRates(data.rates)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="p-4 lg:p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Configuration des taxes</h1>
          <p className="text-[var(--text-secondary)] text-sm">Définissez les taux de TVA par pays</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleReset}
            className="border-[var(--border)] text-[var(--text-muted)] hover:text-white hover:border-[var(--border-hover)]/30">
            Réinitialiser
          </Button>
          <Button onClick={handleSave} disabled={saved}>
            <Save className="w-4 h-4" />
            {saved ? "Enregistré !" : "Enregistrer"}
          </Button>
        </div>
      </div>

      <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-[var(--text-link)]/10 flex items-center justify-center">
            <Percent className="w-5 h-5 text-[var(--text-link)]" />
          </div>
          <div>
            <h2 className="font-bold text-white">Taux de TVA</h2>
            <p className="text-xs text-[var(--text-secondary)]">Le taux est appliqué automatiquement dans le panier et le checkout</p>
          </div>
        </div>

        <div className="space-y-3 mb-6">
          {rates.map((rate) => {
            const country = countries.find((c) => c.id === rate.countryId)
            return (
              <div key={rate.countryId} className="flex items-center gap-4 p-4 rounded-xl bg-[var(--bg-primary)] border border-[var(--border)]">
                <div className="w-10 h-10 rounded-lg bg-[var(--bg-elevated)] flex items-center justify-center text-lg">
                  {country?.flag || "ðŸ³ï¸"}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-white">{country?.name || rate.countryId}</p>
                  <p className="text-[10px] text-[var(--text-secondary)]">{rate.label}</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={rate.rate}
                      onChange={(e) => updateRate(rate.countryId, parseFloat(e.target.value) || 0)}
                      className="w-24 px-3 py-2 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] text-white text-sm font-semibold text-center outline-none focus:border-[var(--border-hover)] transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-[var(--text-secondary)] pointer-events-none">%</span>
                  </div>
                  <button onClick={() => removeRate(rate.countryId)} className="p-2 rounded-xl hover:bg-red-500/10 text-[var(--text-secondary)] hover:text-red-400 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        <div className="flex items-center gap-3 p-4 rounded-xl bg-[var(--bg-primary)] border border-dashed border-[var(--border)]">
          <Globe className="w-5 h-5 text-[var(--text-secondary)]" />
          <select
            value={newCountryId}
            onChange={(e) => setNewCountryId(e.target.value)}
            className="flex-1 px-3 py-2 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] text-white text-sm outline-none focus:border-[var(--border-hover)] transition-colors"
          >
            <option value="">Ajouter un pays...</option>
            {countries
              .filter((c) => !rates.find((r) => r.countryId === c.id))
              .map((c) => (
                <option key={c.id} value={c.id}>{c.flag} {c.name}</option>
              ))}
          </select>
          <Button size="sm" onClick={addCountry} disabled={!newCountryId}>
            <Plus className="w-4 h-4" /> Ajouter
          </Button>
        </div>
      </div>

      <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] p-6">
        <h3 className="font-bold text-white text-sm mb-2">Comment ça marche ?</h3>
        <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
          Le taux de TVA est appliqué automatiquement sur le sous-total du panier et du checkout.
          Chaque pays peut avoir son propre taux. Les modifications sont instantanées pour tous les utilisateurs.
        </p>
        <p className="text-xs text-[var(--text-muted)] mt-2">
          Taux actuel pour le Cameroun : <strong className="text-white">{rates.find((r) => r.countryId === "CM")?.rate || 19.25}%</strong>
        </p>
      </div>
    </div>
  )
}

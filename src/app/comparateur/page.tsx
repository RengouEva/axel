"use client"

import { Trash2, Plus, Star, ShoppingCart, X } from "lucide-react"
import Button from "@/components/ui/button"
import { AnimatedDiv } from "@/lib/animations"
import { hasCreditRates } from "@/data/product-types"
import { useCompare } from "@/lib/compare-context"
import { useCart } from "@/lib/cart-context"
import Link from "next/link"

const specKeys = ["Marque", "Stockage", "RAM", "Écran", "Processeur", "Batterie", "Garantie"]

export default function ComparePage() {
  const { items, removeItem, clearAll } = useCompare()
  const { addItem } = useCart()

  if (items.length === 0) {
    return (
      <div className="w-full min-h-screen bg-[var(--bg-primary)]">
        <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <div className="w-20 h-20 rounded-2xl bg-[var(--bg-secondary)] flex items-center justify-center mx-auto mb-6">
            <Plus className="w-10 h-10 text-[var(--text-secondary)]" />
          </div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">Aucun produit à comparer</h1>
          <p className="text-[var(--text-secondary)] mb-6">Ajoutez des produits pour les comparer</p>
          <Link href="/produits"><Button size="lg">Parcourir les produits</Button></Link>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full min-h-screen bg-[var(--bg-primary)]">
      <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-[var(--text-primary)]">Comparateur</h1>
            <p className="text-[var(--text-secondary)]">{items.length} produit(s) comparés</p>
          </div>
          <Button variant="ghost" onClick={clearAll}><Trash2 className="w-4 h-4" /> Tout vider</Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead>
              <tr>
                <th className="text-left text-sm text-[var(--text-secondary)] font-medium p-4 w-40" />
                {items.map(p => (
                  <th key={p.id} className="p-4 text-center min-w-[200px]">
                    <div className="relative">
                      <button onClick={() => removeItem(p.id)} className="absolute -top-2 -right-2 w-8 h-8 rounded-xl bg-[var(--bg-primary)] border-2 border-[var(--border)] flex items-center justify-center hover:border-red-200 hover:text-red-500 transition-colors"><X className="w-4 h-4" /></button>
                      <div className="aspect-square rounded-2xl bg-[var(--bg-secondary)] overflow-hidden mb-3 max-w-[200px] mx-auto">
                        <img src={p.image} alt={p.name} className="w-full h-full object-contain" />
                      </div>
                      <p className="text-xs text-[var(--text-link)] font-semibold">{p.brand}</p>
                      <h3 className="font-semibold text-[var(--text-primary)] text-sm">{p.name}</h3>
                      <div className="flex items-center justify-center gap-1 mt-1">
                        <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                        <span className="text-xs font-semibold">{p.rating}</span>
                      </div>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="border-t-2 border-[var(--border)]">
                <td className="p-4 text-sm font-semibold text-[var(--text-primary)]">Prix comptant</td>
                {items.map(p => (
                  <td key={p.id} className="p-4 text-center"><span className="text-xl font-bold text-[var(--text-primary)]">{p.price.toLocaleString("fr-FR")} F</span></td>
                ))}
              </tr>
              {items.some(p => hasCreditRates((p as any).creditRates)) && (
              <tr className="border-t border-[var(--border)]">
                <td className="p-4 text-sm font-semibold text-[var(--text-primary)]">Prix/mois</td>
                {items.map(p => (
                  <td key={p.id} className="p-4 text-center">
                    {hasCreditRates((p as any).creditRates) ? (
                      <span className="text-base font-bold text-[var(--text-link)]">{p.monthlyPrice.toLocaleString("fr-FR")} F/mois</span>
                    ) : <span className="text-base text-[var(--text-muted)]">&mdash;</span>}
                  </td>
                ))}
              </tr>
              )}
              <tr className="border-t border-[var(--border)]">
                <td className="p-4 text-sm font-semibold text-[var(--text-primary)]">En stock</td>
                {items.map(p => (
                  <td key={p.id} className="p-4 text-center">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${p.inStock ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}`}>
                      {p.inStock ? "Oui" : "Non"}
                    </span>
                  </td>
                ))}
              </tr>
              <tr className="border-t border-[var(--border)]">
                <td className="p-4 text-sm font-semibold text-[var(--text-primary)]">Promotion</td>
                {items.map(p => (
                  <td key={p.id} className="p-4 text-center">
                    {p.promotion ? <span className="px-3 py-1 rounded-full text-xs font-semibold gradient-axel text-white">-20%</span> : <span className="text-[var(--text-secondary)]">-</span>}
                  </td>
                ))}
              </tr>
              {specKeys.map(spec => (
                <tr key={spec} className="border-t border-[var(--border)]">
                  <td className="p-4 text-sm text-[var(--text-secondary)]">{spec}</td>
                  {items.map(p => (
                    <td key={p.id} className="p-4 text-center text-sm text-[var(--text-primary)]">-</td>
                  ))}
                </tr>
              ))}
              <tr className="border-t-2 border-[var(--border)]">
                <td className="p-4" />
                {items.map(p => (
                  <td key={p.id} className="p-4 text-center">
                    <Button size="sm" className="w-full" onClick={() => addItem(p)}>
                      <ShoppingCart className="w-4 h-4" /> Ajouter
                    </Button>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

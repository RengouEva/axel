"use client"

import { ArrowLeft, Heart, ShoppingCart } from "lucide-react"
import Button from "@/components/ui/button"
import Badge from "@/components/ui/badge"
import { useFavorites } from "@/lib/favorites-context"
import { useCart } from "@/lib/cart-context"
import { AnimatedDiv } from "@/lib/animations"
import { hasCreditRates } from "@/data/products"
import Link from "next/link"

export default function FavoritesPage() {
  const { items, removeFavorite } = useFavorites()
  const { addItem } = useCart()

  if (items.length === 0) {
    return (
      <div className="w-full min-h-screen bg-[var(--bg-primary)]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <Heart className="w-12 h-12 text-[var(--text-secondary)] mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">Aucun favori</h1>
          <Link href="/produits"><Button>Découvrir des produits</Button></Link>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full min-h-screen bg-[var(--bg-primary)]">
      <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/compte" className="p-2 rounded-xl hover:bg-[var(--bg-secondary)] transition-colors"><ArrowLeft className="w-5 h-5 text-[var(--text-secondary)]" /></Link>
          <h1 className="text-4xl font-bold text-[var(--text-primary)]">Mes favoris ({items.length})</h1>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {items.map((product, i) => (
            <AnimatedDiv key={product.id} fade slideUp delay={i * 0.05} className="group bg-[var(--bg-primary)] rounded-2xl border-2 border-[var(--border)] hover:border-transparent hover:shadow-axel-xl transition-all duration-500 hover:-translate-y-2 overflow-hidden">
              <Link href={`/produit/${product.slug}`} className="relative aspect-square bg-[var(--bg-secondary)] overflow-hidden block">
                <img src={product.image} alt={product.name} className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-700" />
                <div className="absolute top-3 left-3 flex flex-col gap-2">
                  {product.promotion && <Badge variant="promo">Promo</Badge>}
                  {hasCreditRates((product as any).creditRates) && <Badge variant="credit">À crédit</Badge>}
                </div>
                <button onClick={(e) => { e.preventDefault(); removeFavorite(product.id) }} className="absolute top-3 right-3 w-9 h-9 rounded-xl bg-white/90 flex items-center justify-center shadow-axel hover:bg-[var(--bg-primary)] transition-all"><Heart className="w-4 h-4 fill-red-500 text-red-500" /></button>
              </Link>
              <div className="p-4">
                <p className="text-xs text-[var(--text-link)] font-semibold">{product.brand}</p>
                <Link href={`/produit/${product.slug}`}><h3 className="font-semibold text-[var(--text-primary)] text-sm hover:text-[var(--text-link)] transition-colors">{product.name}</h3></Link>
                <p className="text-lg font-bold text-[var(--text-primary)] mt-1">{product.price.toLocaleString("fr-FR")} F</p>
                {hasCreditRates((product as any).creditRates) && <p className="text-xs text-[var(--text-link)] font-semibold">{product.monthlyPrice.toLocaleString("fr-FR")} F/mois</p>}
                <Button size="sm" className="w-full mt-3" onClick={() => { addItem(product); removeFavorite(product.id) }}><ShoppingCart className="w-4 h-4" /> Ajouter au panier</Button>
              </div>
            </AnimatedDiv>
          ))}
        </div>
      </div>
    </div>
  )
}

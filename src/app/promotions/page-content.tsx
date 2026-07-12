"use client"

import { Zap, Clock, Star } from "lucide-react"
import Button from "@/components/ui/button"
import Badge from "@/components/ui/badge"
import type { Product } from "@/data/products"
import { AnimatedDiv } from "@/lib/animations"
import { useCart } from "@/lib/cart-context"
import Link from "next/link"

export default function PromotionsPageContent({ products }: { products: Product[] }) {
  const { addItem } = useCart()

  return (
    <div className="w-full min-h-screen bg-[var(--bg-primary)]">
      <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AnimatedDiv fade slideUp className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-50 text-red-600 text-sm font-semibold mb-4"><Zap className="w-4 h-4" /> Offres limitées</div>
          <h1 className="text-4xl font-bold text-[var(--text-primary)] mb-2">Promotions</h1>
          <p className="text-[var(--text-secondary)]">Profitez de nos meilleures offres avant la fin des stocks</p>
        </AnimatedDiv>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((product, i) => (
            <AnimatedDiv key={product.id} fade slideUp delay={i * 0.05} className="group bg-[var(--bg-primary)] rounded-2xl border-2 border-[var(--border)] hover:border-transparent hover:shadow-axel-xl transition-all duration-500 hover:-translate-y-2 overflow-hidden">
              <Link href={`/produit/${product.slug}`} className="relative aspect-square bg-[var(--bg-secondary)] overflow-hidden block">
                <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                <div className="absolute top-3 left-3"><Badge variant="promo"><Zap className="w-3 h-3" /> -20%</Badge></div>
                {product.boosted && (
                  <div className="absolute top-3 right-3">
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-yellow-50 text-yellow-700 text-[10px] font-semibold shadow-sm">
                      <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                      En vedette
                    </span>
                  </div>
                )}
              </Link>
              <div className="p-4">
                <p className="text-xs text-[var(--text-link)] font-semibold">{product.brand}</p>
                {product.shop && <p className="text-[10px] text-[var(--text-muted)]">{product.shop.name}</p>}
                <Link href={`/produit/${product.slug}`}><h3 className="font-semibold text-[var(--text-primary)] text-sm">{product.name}</h3></Link>
                <div className="flex items-baseline gap-2 mt-1"><span className="text-xl font-bold text-[var(--text-primary)]">{product.price.toLocaleString("fr-FR")} F</span><span className="text-xs text-[var(--text-secondary)] line-through">{(Math.round(product.price * 1.25)).toLocaleString("fr-FR")} F</span></div>
                <Button size="sm" className="w-full mt-3" onClick={() => addItem(product)}>Ajouter au panier</Button>
              </div>
            </AnimatedDiv>
          ))}
        </div>
      </div>
    </div>
  )
}

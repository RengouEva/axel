"use client"

import { ShoppingCart, Star, Eye, Zap, Store, Heart } from "lucide-react"
import Button from "@/components/ui/button"
import Badge from "@/components/ui/badge"
import { AnimatedDiv } from "@/lib/animations"
import { useFavorites } from "@/lib/favorites-context"
import { useCart } from "@/lib/cart-context"
import { useCompare } from "@/lib/compare-context"
import { hasCreditRates } from "@/data/products"
import Link from "next/link"

interface Product {
  id: number; name: string; brand: string; category: string; price: number
  monthlyPrice: number; rating: number; reviews: number; inStock: boolean
  promotion: boolean; image: string; images: string[]; slug: string
  creditRates?: string; description?: string; shopId?: string
  shop?: { id: string; name: string; slug: string; logo: string; category: string; badges?: { type: string; label: string; color: string; icon?: string }[] }
  badges?: { type: string; label: string; color: string; icon?: string }[]
  boosted?: boolean
}

export default function ProductGridContent({ products }: { products: Product[] }) {
  const { toggleFavorite, isFavorite } = useFavorites()
  const { addItem } = useCart()
  const { addItem: addCompare } = useCompare()

  return (
    <section className="py-12 sm:py-16 lg:py-20 bg-[var(--bg-secondary)]">
      <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        <AnimatedDiv fade slideUp className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 sm:mb-12">
          <div>
            <span className="text-[var(--text-link)] font-semibold text-xs sm:text-sm tracking-wider uppercase mb-2 block">
              Produits
            </span>
            <h2 className="text-2xl sm:text-4xl lg:text-4xl font-bold text-[var(--text-primary)]">
              Nos meilleures offres
            </h2>
          </div>
          <div className="flex gap-3">
            <Link href="/produits"><Button variant="outline" size="sm">Voir tout</Button></Link>
          </div>
        </AnimatedDiv>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
          {products.map((product, index) => {
            const isFav = isFavorite(product.id)

            return (
              <AnimatedDiv
                key={product.id}
                fade
                slideUp
                delay={index * 0.05}
                className="group relative bg-[var(--bg-primary)] rounded-2xl border-2 border-[var(--border)] 
                  hover:border-transparent hover:shadow-axel-xl transition-all duration-500
                  hover:-translate-y-2 overflow-hidden active:scale-[0.98]"
              >
                <Link href={`/produit/${product.slug}`} className="relative aspect-square bg-[var(--bg-secondary)] overflow-hidden block">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-700"
                    loading="lazy"
                  />
                  <div className="absolute top-2 sm:top-3 left-2 sm:left-3 flex flex-col gap-1.5 sm:gap-2">
                    {product.promotion && (
                      <Badge variant="promo">
                        <Zap className="w-3 h-3" /> Promo
                      </Badge>
                    )}
                    {hasCreditRates(product.creditRates) && (
                      <Badge variant="credit">
                        <Zap className="w-3 h-3" /> À crédit
                      </Badge>
                    )}
                  </div>

                  <button
                    onClick={(e) => { e.preventDefault(); toggleFavorite(product) }}
                    className="absolute top-2 sm:top-3 right-2 sm:right-3 w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-white/90 backdrop-blur-sm 
                      flex items-center justify-center hover:bg-[var(--bg-primary)] transition-all duration-300
                      shadow-axel"
                  >
                    <Heart className={`w-5 h-5 ${isFav ? "fill-red-500 text-red-500" : "text-[var(--text-secondary)]"}`} />
                  </button>

                  {!product.inStock && (
                    <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center">
                      <span className="px-4 py-2 rounded-full bg-[#64748B] text-white text-sm font-medium">
                        Épuisé
                      </span>
                    </div>
                  )}
                </Link>

                <div className="p-4 sm:p-5">
                  <p className="text-[10px] sm:text-xs text-[var(--text-link)] font-semibold mb-1">{product.brand}</p>
                  {product.shop && (
                    <p className="text-[10px] text-[var(--text-muted)] mb-1 flex items-center gap-1.5 flex-wrap">
                      <Store className="w-3 h-3" />
                      {product.shop.name}
                      {product.shop.badges?.map(badge => (
                        <span
                          key={badge.type}
                          className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[8px] font-semibold leading-tight"
                          style={{ backgroundColor: badge.color + "20", color: badge.color }}
                        >
                          {badge.label}
                        </span>
                      ))}
                    </p>
                  )}
                  <Link href={`/produit/${product.slug}`}>
                    <h3 className="font-semibold text-[var(--text-primary)] text-sm sm:text-base mb-2 line-clamp-1 hover:text-[var(--text-link)] transition-colors">
                      {product.name}
                    </h3>
                  </Link>

                  <div className="flex items-center gap-1 mb-2 sm:mb-3">
                    <Star className="w-3.5 sm:w-4 h-3.5 sm:h-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-xs sm:text-sm font-semibold text-[var(--text-primary)]">{product.rating}</span>
                    <span className="text-[10px] sm:text-xs text-[var(--text-secondary)]">({product.reviews})</span>
                  </div>

                  <div className="mb-3 sm:mb-4">
                    <p className="text-xl sm:text-2xl font-bold text-[var(--text-primary)]">
                      {product.price.toLocaleString("fr-FR")} F
                    </p>
                    {hasCreditRates(product.creditRates) && (
                      <p className="text-xs sm:text-sm text-[var(--text-link)] font-semibold">
                        À partir de {product.monthlyPrice.toLocaleString("fr-FR")} F/mois
                      </p>
                    )}
                    {product.boosted && (
                      <span className="inline-flex items-center gap-1 mt-1 text-[10px] font-semibold text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded-full">
                        <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                        En vedette
                      </span>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button size="sm" className="flex-1" onClick={() => addItem(product)}>
                      <ShoppingCart className="w-4 h-4" />
                      Acheter
                    </Button>
                    <Link href={`/produit/${product.slug}`}>
                      <Button size="sm" variant="outline" className="px-2.5 sm:px-3">
                        <Eye className="w-4 h-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </AnimatedDiv>
            )
          })}
        </div>
      </div>
    </section>
  )
}

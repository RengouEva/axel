"use client"

import { useState } from "react"
import { Search, Grid3X3, List, Heart } from "lucide-react"
import Button from "@/components/ui/button"
import Input from "@/components/ui/input"
import Badge from "@/components/ui/badge"
import StarRating from "@/components/ui/star-rating"
import type { Product } from "@/data/product-types"
import { hasCreditRates } from "@/data/product-types"
import type { Category } from "@/data/categories"
import { AnimatedDiv } from "@/lib/animations"
import { useFavorites } from "@/lib/favorites-context"
import { useCart } from "@/lib/cart-context"
import Link from "next/link"
import AdContainer from "@/components/ads/ad-container"

const PLACEHOLDER_IMG = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 200 200'%3E%3Crect fill='%23f1f5f9' width='200' height='200'/%3E%3Ctext x='50%25' y='50%25' fill='%2394a3b8' font-family='sans-serif' font-size='14' text-anchor='middle' dy='.3em'%3EAXEL%3C/text%3E%3C/svg%3E"

function imgError(e: React.SyntheticEvent<HTMLImageElement>) {
  e.currentTarget.src = PLACEHOLDER_IMG
}

export default function CategoryPageContent({ products, category }: { products: Product[]; category: Category }) {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [searchQuery, setSearchQuery] = useState("")
  const { toggleFavorite, isFavorite } = useFavorites()
  const { addItem } = useCart()

  let filtered = products
  if (searchQuery) {
    filtered = filtered.filter(p =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.brand.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }

  return (
    <div className="w-full min-h-screen bg-[var(--bg-primary)]">
      <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AnimatedDiv fade slideUp>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl gradient-axel flex items-center justify-center">
              <span className="text-white font-bold text-lg">{category.name[0]}</span>
            </div>
            <div>
              <h1 className="text-4xl sm:text-4xl font-bold text-[var(--text-primary)]">{category.name}</h1>
              <p className="text-[var(--text-secondary)]">Tous nos produits {category.name.toLowerCase()}</p>
            </div>
          </div>
        </AnimatedDiv>

        <AdContainer slot="CATEGORY_TOP" variant="banner" className="mb-6" />

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 p-4 rounded-2xl bg-[var(--bg-secondary)]">
          <div className="relative w-full sm:w-64">
            <Input icon={<Search className="w-4 h-4" />} placeholder="Rechercher dans cette catégorie..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="bg-[var(--bg-primary)] text-sm" />
          </div>
          <div className="flex border-2 border-[var(--border)] rounded-xl overflow-hidden">
            <button onClick={() => setViewMode("grid")} className={`p-2 ${viewMode === "grid" ? "bg-[var(--text-link)] text-white" : "text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]"}`}><Grid3X3 className="w-4 h-4" /></button>
            <button onClick={() => setViewMode("list")} className={`p-2 ${viewMode === "list" ? "bg-[var(--text-link)] text-white" : "text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]"}`}><List className="w-4 h-4" /></button>
          </div>
        </div>

        <AdContainer slot="CATEGORY_BOTTOM" category={category.name} variant="card" limit={4} title="Produits sponsorisés" className="mb-6" />

        {filtered.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-[var(--text-secondary)] text-lg">Aucun produit trouvé dans cette catégorie</p>
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
            {filtered.map((product, index) => (
              <AnimatedDiv key={product.id} fade slideUp delay={index * 0.05} className="group bg-[var(--bg-primary)] rounded-2xl border-2 border-[var(--border)] hover:border-transparent hover:shadow-axel-xl transition-all duration-500 hover:-translate-y-2 overflow-hidden">
                <Link href={`/produit/${product.slug}`} className="relative aspect-square bg-[var(--bg-secondary)] overflow-hidden block">
                  <img src={product.image} alt={product.name} className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-700" onError={imgError} />
                  <div className="absolute top-3 left-3 flex flex-col gap-2">
                    {product.promotion && <Badge variant="promo">Promo</Badge>}
                    {hasCreditRates(product.creditRates) && <Badge variant="credit">À crédit</Badge>}
                  </div>
                </Link>
                <div className="p-4">
                  <p className="text-xs text-[var(--text-link)] font-semibold">{product.brand}</p>
                  <Link href={`/produit/${product.slug}`}><h3 className="font-semibold text-[var(--text-primary)] text-sm line-clamp-1 hover:text-[var(--text-link)] transition-colors">{product.name}</h3></Link>
                  <div className="my-1"><StarRating rating={product.rating} size="xs" /></div>
                  <p className="text-lg font-bold text-[var(--text-primary)]">{product.price.toLocaleString("fr-FR")} F</p>
                  {hasCreditRates(product.creditRates) && <p className="text-xs text-[var(--text-link)] font-semibold">{product.monthlyPrice.toLocaleString("fr-FR")} F/mois</p>}
                  <div className="flex gap-2 mt-3">
                    <Button size="sm" className="flex-1" onClick={() => addItem(product)}>Acheter</Button>
                    <button onClick={() => toggleFavorite(product)} className="w-9 h-9 rounded-xl border-2 border-[var(--border)] flex items-center justify-center hover:border-red-200 transition-colors">
                      <Heart className={`w-4 h-4 ${isFavorite(product.id) ? "fill-red-500 text-red-500" : "text-[var(--text-secondary)]"}`} />
                    </button>
                  </div>
                </div>
              </AnimatedDiv>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((product, index) => (
              <AnimatedDiv key={product.id} fade slideUp delay={index * 0.03} className="flex gap-4 p-4 rounded-2xl border-2 border-[var(--border)] hover:shadow-axel-lg transition-all">
                <Link href={`/produit/${product.slug}`} className="w-24 h-24 rounded-xl bg-[var(--bg-secondary)] overflow-hidden shrink-0"><img src={product.image} alt="" className="w-full h-full object-contain" onError={imgError} /></Link>
                <div className="flex-1">
                  <p className="text-xs text-[var(--text-link)] font-semibold">{product.brand}</p>
                  <Link href={`/produit/${product.slug}`}><h3 className="font-semibold text-[var(--text-primary)] hover:text-[var(--text-link)]">{product.name}</h3></Link>
                  <div className="flex items-center gap-3 mt-1"><span className="text-lg font-bold text-[var(--text-primary)]">{product.price.toLocaleString("fr-FR")} F</span>{hasCreditRates(product.creditRates) && <span className="text-xs text-[var(--text-link)] font-semibold">{product.monthlyPrice.toLocaleString("fr-FR")} F/mois</span>}</div>
                  <div className="flex gap-2 mt-2"><Button size="sm" onClick={() => addItem(product)}>Ajouter au panier</Button></div>
                </div>
              </AnimatedDiv>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

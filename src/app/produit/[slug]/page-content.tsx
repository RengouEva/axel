"use client"

import { useState } from "react"
import { notFound } from "next/navigation"
import {
  Heart, Share2, Star, ShoppingCart, CreditCard, Store,
  ChevronDown, Check, Truck, Shield, RotateCcw
} from "lucide-react"
import Button from "@/components/ui/button"
import Badge from "@/components/ui/badge"
import ProductGallery from "@/components/product/product-gallery"
import CreditSimulator from "@/components/product/credit-simulator"
import ProductReviews from "@/components/product/product-reviews"
import type { Product } from "@/data/products"
import { AnimatedDiv } from "@/lib/animations"
import { useCart } from "@/lib/cart-context"
import { useFavorites } from "@/lib/favorites-context"
import { ProductDetailSkeleton } from "@/components/ui/skeleton"
import Link from "next/link"

export default function ProductDetailClient({ product }: { product: Product }) {
  const [activeTab, setActiveTab] = useState<"description" | "specs" | "reviews">("description")
  const { addItem } = useCart()
  const { toggleFavorite, isFavorite } = useFavorites()

  if (!product) return <ProductDetailSkeleton />

  const tabs = [
    { key: "description", label: "Description" },
    { key: "specs", label: "Caractéristiques" },
    { key: "reviews", label: "Avis" },
  ] as const

  const handleTabKeyDown = (e: React.KeyboardEvent, currentIndex: number) => {
    let nextIndex: number | null = null
    if (e.key === "ArrowRight") {
      nextIndex = (currentIndex + 1) % tabs.length
    } else if (e.key === "ArrowLeft") {
      nextIndex = (currentIndex - 1 + tabs.length) % tabs.length
    } else if (e.key === "Home") {
      nextIndex = 0
    } else if (e.key === "End") {
      nextIndex = tabs.length - 1
    }
    if (nextIndex !== null) {
      e.preventDefault()
      setActiveTab(tabs[nextIndex].key)
      document.getElementById(`tab-${tabs[nextIndex].key}`)?.focus()
    }
  }
  const specs = [
    { label: "Marque", value: product.brand },
    { label: "Modèle", value: product.name },
    ...(product.shop ? [{ label: "Boutique", value: product.shop.name }] : []),
    { label: "Prix", value: `${product.price.toLocaleString("fr-FR")} F` },
    { label: "Mensualité", value: `${product.monthlyPrice.toLocaleString("fr-FR")} F/mois` },
    { label: "Note", value: `${product.rating}/5` },
    { label: "Avis", value: `${product.reviews} avis` },
    { label: "Stock", value: product.inStock ? "Disponible" : "Épuisé" },
    { label: "Garantie", value: "2 ans" },
  ]

  return (
    <div className="w-full min-h-screen bg-[var(--bg-primary)]">
      <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <nav aria-label="Fil d'Ariane" className="flex items-center gap-2 text-sm text-[var(--text-secondary)] mb-8">
          <Link href="/" className="hover:text-[var(--text-link)] transition-colors">Accueil</Link>
          <ChevronDown className="w-3 h-3 -rotate-90" aria-hidden="true" />
          <Link href="/produits" className="hover:text-[var(--text-link)] transition-colors">Produits</Link>
          <ChevronDown className="w-3 h-3 -rotate-90" aria-hidden="true" />
          <span className="text-[var(--text-primary)] font-medium" aria-current="page">{product.name}</span>
        </nav>

        <div className="grid lg:grid-cols-2 gap-12 mb-16">
          <ProductGallery productName={product.name} images={product.images} />

          <AnimatedDiv fade slideUp className="space-y-6">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2">
                <Badge variant="credit">Paiement à crédit disponible</Badge>
                {product.promotion && <Badge variant="promo">Promotion -20%</Badge>}
                <h1 className="text-4xl lg:text-4xl font-bold text-[var(--text-primary)] leading-tight">
                  {product.name}
                </h1>
                <p className="text-[var(--text-secondary)]">{product.brand}</p>
                {product.shop && (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <Link href={`/boutique/${product.shop.slug}`} className="inline-flex items-center gap-1.5 text-xs text-[var(--text-link)] font-medium hover:underline">
                      <Store className="w-3.5 h-3.5" />
                      {product.shop.name}
                    </Link>
                    {product.shop.badges?.map(badge => (
                      <span
                        key={badge.type}
                        className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-semibold leading-tight"
                        style={{ backgroundColor: badge.color + "20", color: badge.color }}
                      >
                        {badge.label}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => toggleFavorite(product)}
                  aria-label={isFavorite(product.id) ? "Retirer des favoris" : "Ajouter aux favoris"}
                  aria-pressed={isFavorite(product.id)}
                  className="w-10 h-10 rounded-xl border-2 border-[var(--border)] flex items-center justify-center hover:border-[var(--border-hover)]/30 transition-all"
                >
                  <Heart className={`w-5 h-5 ${isFavorite(product.id) ? "fill-red-500 text-red-500" : "text-[var(--text-secondary)]"}`} />
                </button>
                <button
                  aria-label="Partager ce produit"
                  className="w-10 h-10 rounded-xl border-2 border-[var(--border)] flex items-center justify-center hover:border-[var(--border-hover)]/30 transition-all"
                >
                  <Share2 className="w-5 h-5 text-[var(--text-secondary)]" />
                </button>
              </div>
            </div>

            <div className="bg-[var(--bg-secondary)] rounded-2xl p-6 space-y-3">
              <div className="flex items-baseline gap-3">
                <span className="text-4xl font-bold text-[var(--text-primary)]">
                  {product.price.toLocaleString("fr-FR")} F
                </span>
                {product.promotion && (
                  <span className="text-lg text-[var(--text-secondary)] line-through">
                    {(Math.round(product.price * 1.25)).toLocaleString("fr-FR")} F
                  </span>
                )}
              </div>
              <p className="text-[var(--text-link)] font-semibold">
                À partir de <span className="text-lg">{product.monthlyPrice.toLocaleString("fr-FR")} F/mois</span>
              </p>
              <p className="text-sm text-[var(--text-secondary)] flex items-center gap-1">
                <Check className="w-4 h-4 text-green-500" aria-hidden="true" />
                {product.inStock ? "En stock - Livraison sous 48h" : "Actuellement indisponible"}
              </p>
            </div>

            <CreditSimulator price={product.price} productName={product.name} creditRates={product.creditRates} />

            <div className="flex gap-3">
              <Button size="lg" className="flex-1" onClick={() => addItem(product)} aria-label="Ajouter au panier">
                <ShoppingCart className="w-5 h-5" aria-hidden="true" />
                Ajouter au panier
              </Button>
              <Button size="lg" variant="outline" className="flex-1" aria-label="Demander un crédit">
                <CreditCard className="w-5 h-5" aria-hidden="true" />
                Demander un crédit
              </Button>
            </div>

            <div className="grid grid-cols-3 gap-4">
              {[
                { icon: Truck, label: "Livraison", desc: "Gratuite dès 50 000 F" },
                { icon: Shield, label: "Sécurité", desc: "Paiement 100% sécurisé" },
                { icon: RotateCcw, label: "Retour", desc: "30 jours gratuit" },
              ].map(({ icon: Icon, label, desc }) => (
                <div key={label} className="text-center p-4 rounded-xl bg-[var(--bg-secondary)]">
                  <Icon className="w-5 h-5 text-[var(--text-link)] mx-auto mb-2" aria-hidden="true" />
                  <p className="font-semibold text-xs text-[var(--text-primary)]">{label}</p>
                  <p className="text-[10px] text-[var(--text-secondary)]">{desc}</p>
                </div>
              ))}
            </div>
          </AnimatedDiv>
        </div>

        <div className="mb-16">
          <div role="tablist" aria-label="Détails du produit" className="flex border-b-2 border-[var(--border)] mb-8">
            {tabs.map((tab, index) => (
              <button
                key={tab.key}
                role="tab"
                aria-selected={activeTab === tab.key}
                aria-controls={`panel-${tab.key}`}
                id={`tab-${tab.key}`}
                tabIndex={activeTab === tab.key ? 0 : -1}
                onClick={() => setActiveTab(tab.key)}
                onKeyDown={(e) => handleTabKeyDown(e, index)}
                className={`px-6 py-3 text-sm font-semibold border-b-2 -mb-[2px] transition-colors ${
                  activeTab === tab.key
                    ? "border-[var(--border-hover)] text-[var(--text-link)]"
                    : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === "description" && (
            <div role="tabpanel" id="panel-description" aria-labelledby="tab-description" className="max-w-3xl">
              <p className="text-[var(--text-secondary)] leading-relaxed mb-4">
                Découvrez le {product.name} par {product.brand}. Avec son design élégant et ses performances
                exceptionnelles, ce produit vous offre le meilleur de la technologie moderne.
              </p>
              <p className="text-[var(--text-secondary)] leading-relaxed mb-4">
                Profitez du paiement à crédit AXEL pour acquérir ce produit dès maintenant
                et payez en mensualités adaptées à votre budget.
              </p>
              <ul className="space-y-2">
                {[
                  "Design premium ultra fin",
                  "Performances de pointe",
                  "Écran haute résolution",
                  "Autonomie exceptionnelle",
                  "Garantie constructeur 2 ans",
                  "Livraison express gratuite"
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                    <Check className="w-4 h-4 text-[var(--text-link)]" aria-hidden="true" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {activeTab === "specs" && (
            <div role="tabpanel" id="panel-specs" aria-labelledby="tab-specs" className="grid sm:grid-cols-2 max-w-2xl gap-x-8 gap-y-4">
              {specs.map((spec) => (
                <div key={spec.label} className="flex justify-between py-3 border-b border-[var(--border)]">
                  <span className="text-sm text-[var(--text-secondary)]">{spec.label}</span>
                  <span className="text-sm font-semibold text-[var(--text-primary)]">{spec.value}</span>
                </div>
              ))}
            </div>
          )}

          {activeTab === "reviews" && (
            <div role="tabpanel" id="panel-reviews" aria-labelledby="tab-reviews">
              <ProductReviews />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

"use client"

import { Store, MapPin, Phone, Mail, Star, Package, Shield, ChevronDown } from "lucide-react"
import Button from "@/components/ui/button"
import StarRating from "@/components/ui/star-rating"
import { useCart } from "@/lib/cart-context"
import type { Product } from "@/data/product-types"
import type { Shop } from "@/data/shops"
import type { Country, City, District } from "@/data/delivery"
import Link from "next/link"

const PLACEHOLDER_IMG = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 200 200'%3E%3Crect fill='%23f1f5f9' width='200' height='200'/%3E%3Ctext x='50%25' y='50%25' fill='%2394a3b8' font-family='sans-serif' font-size='14' text-anchor='middle' dy='.3em'%3EAXEL%3C/text%3E%3C/svg%3E"

function imgError(e: React.SyntheticEvent<HTMLImageElement>) {
  e.currentTarget.src = PLACEHOLDER_IMG
}

export default function BoutiquePageContent({
  products, shop, countries, cities, districts
}: {
  products: Product[]
  shop: Shop
  countries: Country[]
  cities: City[]
  districts: District[]
}) {
  const { addItem } = useCart()

  const country = countries.find((c) => c.id === shop.countryId)
  const city = cities.find((c) => c.id === shop.cityId)
  const district = districts.find((d) => d.id === shop.districtId)

  return (
    <div className="w-full min-h-screen bg-[var(--bg-primary)]">
      <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <nav aria-label="Fil d'Ariane" className="flex items-center gap-2 text-sm text-[var(--text-secondary)] mb-8">
          <Link href="/" className="hover:text-[var(--text-link)] transition-colors">Accueil</Link>
          <ChevronDown className="w-3 h-3 -rotate-90" aria-hidden="true" />
          <span className="text-[var(--text-primary)] font-medium">{shop.name}</span>
        </nav>

        <div className="rounded-3xl overflow-hidden border-2 border-[var(--border)] mb-12">
          <div className="h-48 sm:h-64 bg-gradient-to-r from-[var(--text-link)] to-[#0B4FC8] relative">
            <div className="absolute -bottom-12 left-8 flex items-end gap-6">
              <div className="w-24 h-24 rounded-2xl bg-white shadow-xl flex items-center justify-center p-2">
                <Store className="w-12 h-12 text-[var(--text-link)]" />
              </div>
              <div className="pb-2">
                <div className="flex items-center gap-3">
                  <h1 className="text-3xl font-bold text-white">{shop.name}</h1>
                  <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-white text-xs font-semibold">
                    {shop.totalSales} ventes
                  </span>
                </div>
                <div className="flex items-center gap-3 text-white/80 text-sm mt-1">
                  <span className="flex items-center gap-1"><Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />{shop.rating}/5</span>
                  {country && <span className="flex items-center gap-1"><MapPin className="w-4 h-4" />{city?.name || ""}</span>}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8 mb-16">
          <div className="lg:col-span-2">
            <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2">
              <Package className="w-5 h-5 text-[var(--text-link)]" />
              Produits ({products.length})
            </h2>
            {products.length === 0 ? (
              <p className="text-[var(--text-secondary)]">Aucun produit dans cette boutique pour le moment.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {products.map((product) => (
                  <Link key={product.id} href={`/produit/${product.slug}`}
                    className="group rounded-2xl border-2 border-[var(--border)] hover:border-transparent hover:shadow-axel-xl transition-all duration-500 hover:-translate-y-1 overflow-hidden">
                    <div className="aspect-square bg-[var(--bg-secondary)] flex items-center justify-center p-8">
                      <img src={product.image} alt={product.name} className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-700" onError={imgError} />
                    </div>
                    <div className="p-4">
                      <p className="text-xs text-[var(--text-link)] font-semibold">{product.brand}</p>
                      <h3 className="font-semibold text-[var(--text-primary)] text-sm">{product.name}</h3>
                      <div className="my-1.5"><StarRating rating={product.rating} size="xs" /></div>
                      <p className="text-lg font-bold text-[var(--text-primary)]">{product.price.toLocaleString("fr-FR")} F</p>
                      <Button size="sm" className="w-full mt-3" onClick={(e) => { e.preventDefault(); addItem(product) }}>
                        Ajouter au panier
                      </Button>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="rounded-2xl border-2 border-[var(--border)] p-6">
              <h3 className="font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                <Store className="w-4 h-4 text-[var(--text-link)]" />
                Informations
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2 text-[var(--text-secondary)]">
                  <MapPin className="w-4 h-4 shrink-0" />
                  <span>{shop.address}{district ? `, ${district.name}` : ""}, {city?.name || ""}</span>
                </div>
                <div className="flex items-center gap-2 text-[var(--text-secondary)]">
                  <Phone className="w-4 h-4 shrink-0" />
                  <a href={`tel:${shop.phone}`} className="hover:text-[var(--text-link)]">{shop.phone}</a>
                </div>
                <div className="flex items-center gap-2 text-[var(--text-secondary)]">
                  <Mail className="w-4 h-4 shrink-0" />
                  <a href={`mailto:${shop.email}`} className="hover:text-[var(--text-link)]">{shop.email}</a>
                </div>
                <p className="text-[var(--text-secondary)] mt-2">{shop.description}</p>
              </div>
            </div>
            <div className="rounded-2xl border-2 border-[var(--border)] p-6">
              <h3 className="font-bold text-[var(--text-primary)] mb-3">Sécurité</h3>
              <div className="space-y-2 text-sm text-[var(--text-secondary)]">
                <p className="flex items-center gap-2"><Shield className="w-4 h-4 text-green-500" /> Paiement 100% sécurisé</p>
                <p className="flex items-center gap-2"><Shield className="w-4 h-4 text-green-500" /> Produits authentiques garantis</p>
                <p className="flex items-center gap-2"><Shield className="w-4 h-4 text-green-500" /> Retour sous 30 jours</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

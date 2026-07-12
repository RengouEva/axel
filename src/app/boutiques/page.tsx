"use client"

import { useState, useMemo, useEffect } from "react"
import Link from "next/link"
import { Store, MapPin, Star, Search, ChevronDown } from "lucide-react"
import type { Shop } from "@/data/shops"
import type { Category } from "@/data/categories"
import type { Country, City } from "@/data/delivery"
import Input from "@/components/ui/input"
import { AnimatedDiv } from "@/lib/animations"

export default function BoutiquesPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [categories, setCategories] = useState<Category[]>([])

  const [shops, setShops] = useState<Shop[]>([])
  const [countries, setCountries] = useState<Country[]>([])
  const [cities, setCities] = useState<City[]>([])

  useEffect(() => {
    Promise.all([
      fetch("/api/categories").then(r => r.json()),
      fetch("/api/shops").then(r => r.json()),
      fetch("/api/locations").then(r => r.json()),
    ]).then(([catData, shopsData, locData]) => {
      setCategories(catData.categories || [])
      setShops(Array.isArray(shopsData) ? shopsData : [])
      setCountries(locData.countries || [])
      setCities(locData.cities || [])
    })
  }, [])

  const filtered = useMemo(() => {
    let result = shops

    if (selectedCategory !== "all") {
      result = result.filter(s => s.category === selectedCategory)
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        s =>
          s.name.toLowerCase().includes(q) ||
          s.description.toLowerCase().includes(q) ||
          s.address.toLowerCase().includes(q)
      )
    }

    return result
  }, [searchQuery, selectedCategory, shops])

  return (
    <div className="w-full min-h-screen bg-[var(--bg-primary)]">
      <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AnimatedDiv fade slideUp>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
            <div>
              <h1 className="text-4xl sm:text-4xl font-bold text-[var(--text-primary)]">Boutiques</h1>
              <p className="text-[var(--text-secondary)] mt-1">{filtered.length} boutique{filtered.length > 1 ? "s" : ""} disponible{filtered.length > 1 ? "s" : ""}</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 my-8">
            <div className="relative flex-1 sm:max-w-md">
              <Input
                icon={<Search className="w-4 h-4" />}
                placeholder="Rechercher une boutique..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="bg-[var(--bg-secondary)] text-sm"
              />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0">
              <button
                onClick={() => setSelectedCategory("all")}
                className={`shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                  selectedCategory === "all"
                    ? "bg-[var(--text-link)] text-white"
                    : "bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border-2 border-[var(--border)]"
                }`}
              >
                Toutes
              </button>
              {categories.map(cat => (
                <button
                  key={cat.slug}
                  onClick={() => setSelectedCategory(cat.slug)}
                  className={`shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                    selectedCategory === cat.slug
                      ? "bg-[var(--text-link)] text-white"
                      : "bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border-2 border-[var(--border)]"
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>
        </AnimatedDiv>

        {filtered.length === 0 ? (
          <div className="text-center py-20">
            <Store className="w-16 h-16 mx-auto text-[var(--text-muted)] mb-4" />
            <p className="text-[var(--text-secondary)] text-lg">Aucune boutique trouvée</p>
            <p className="text-[var(--text-muted)] text-sm mt-1">Essayez de modifier votre recherche</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((shop, index) => (
              <BoutiqueCard key={shop.id} shop={shop} index={index} countries={countries} cities={cities} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function BoutiqueCard({ shop, index, countries, cities }: { shop: Shop; index: number; countries: Country[]; cities: City[] }) {
  const country = countries.find(c => c.id === shop.countryId)
  const city = cities.find(c => c.id === shop.cityId)

  return (
    <AnimatedDiv fade slideUp delay={index * 0.05}>
      <Link
        href={`/boutique/${shop.slug}`}
        className="group block rounded-2xl border-2 border-[var(--border)] hover:border-transparent hover:shadow-axel-xl transition-all duration-500 hover:-translate-y-2 overflow-hidden bg-[var(--bg-card)]"
      >
        <div className="h-32 bg-gradient-to-br from-[var(--text-link)] to-[#0B4FC8] relative">
          <div className="absolute -bottom-10 left-6">
            <div className="w-20 h-20 rounded-2xl bg-white shadow-lg flex items-center justify-center border-2 border-[var(--border-light)]">
              <Store className="w-10 h-10 text-[var(--text-link)]" />
            </div>
          </div>
          <div className="absolute top-3 right-3">
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-white/20 text-white text-[11px] font-semibold backdrop-blur-sm">
              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
              {shop.rating}
            </span>
          </div>
        </div>

        <div className="pt-12 p-5">
          <h3 className="font-bold text-[var(--text-primary)] group-hover:text-[var(--text-link)] transition-colors">
            {shop.name}
          </h3>

          <div className="flex items-center gap-3 mt-2 text-xs text-[var(--text-muted)]">
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {city?.name || "Non localisé"}
            </span>
            <span className="flex items-center gap-1">
              <Store className="w-3 h-3" />
              {shop.totalSales} vente{shop.totalSales > 1 ? "s" : ""}
            </span>
          </div>

          <p className="text-sm text-[var(--text-secondary)] mt-3 line-clamp-2">
            {shop.description}
          </p>
        </div>
      </Link>
    </AnimatedDiv>
  )
}

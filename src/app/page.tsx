"use client"

import { useState, useEffect } from "react"
import Hero from "@/components/sections/hero"
import Categories from "@/components/sections/categories"
import ProductGrid from "@/components/sections/product-grid"
import Promo from "@/components/sections/promo"
import Features from "@/components/sections/features"
import { HeroSkeleton, CategoryCardSkeleton, ProductCardSkeleton } from "@/components/ui/skeleton"

export default function Home() {
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(false)
  }, [])

  if (loading) {
    return (
      <>
        <HeroSkeleton />
        <section className="py-20 bg-[var(--bg-primary)]">
          <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <div className="h-4 w-24 bg-[var(--border)]/60 rounded-full animate-pulse mx-auto mb-2" />
              <div className="h-8 w-64 bg-[var(--border)]/60 rounded-full animate-pulse mx-auto mb-3" />
              <div className="h-4 w-80 bg-[var(--border)]/60 rounded-full animate-pulse mx-auto" />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {Array.from({ length: 12 }).map((_, i) => (
                <CategoryCardSkeleton key={i} />
              ))}
            </div>
          </div>
        </section>
        <section className="py-20 bg-[var(--bg-secondary)]">
          <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <div className="h-4 w-20 bg-[var(--border)]/60 rounded-full animate-pulse mx-auto mb-2" />
              <div className="h-8 w-56 bg-[var(--border)]/60 rounded-full animate-pulse mx-auto" />
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          </div>
        </section>
      </>
    )
  }

  return (
    <>
      <Hero />
      <Categories />
      <ProductGrid />
      <Promo />
      <Features />
    </>
  )
}

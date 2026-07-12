"use client"

import { useEffect, useState } from "react"
import { AnimatedDiv } from "@/lib/animations"
import Link from "next/link"

const brandColors: Record<string, string> = {
  Apple: "#000000", Samsung: "#1428A0", LG: "#A50034", Sony: "#000000",
  iRobot: "#00A3E0", Dyson: "#333333", Bose: "#000000", Philips: "#0B5ED7",
}

export default function BrandsPage() {
  const [brands, setBrands] = useState<{ name: string; count: number }[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/products?limit=1000")
      .then(r => r.json())
      .then(data => {
        const products = data.products || []
        const map: Record<string, number> = {}
        products.forEach((p: any) => {
          if (p.brand) map[p.brand] = (map[p.brand] || 0) + 1
        })
        const sorted = Object.entries(map)
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count)
        setBrands(sorted)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="w-full min-h-screen bg-[var(--bg-primary)]">
      <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AnimatedDiv fade slideUp className="text-center mb-12">
          <h1 className="text-4xl font-bold text-[var(--text-primary)] mb-2">Marques</h1>
          <p className="text-[var(--text-secondary)]">Les plus grandes marques disponibles sur AXEL</p>
        </AnimatedDiv>

        {loading ? (
          <p className="text-center text-[var(--text-secondary)]">Chargement...</p>
        ) : brands.length === 0 ? (
          <p className="text-center text-[var(--text-secondary)]">Aucune marque pour le moment</p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {brands.map((brand, i) => (
              <AnimatedDiv key={brand.name} fade slideUp delay={i * 0.05}>
                <Link href={`/produits?search=${encodeURIComponent(brand.name)}`} className="block p-6 rounded-2xl border-2 border-[var(--border)] hover:border-[var(--border-hover)]/30 hover:shadow-axel-lg transition-all group">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 text-white font-bold text-xl" style={{ backgroundColor: brandColors[brand.name] || "#64748B" }}>
                    {brand.name[0]}
                  </div>
                  <h3 className="font-bold text-[var(--text-primary)] group-hover:text-[var(--text-link)] transition-colors">{brand.name}</h3>
                  <p className="text-xs text-[var(--text-link)] font-semibold mt-2">{brand.count} produit{brand.count > 1 ? "s" : ""}</p>
                </Link>
              </AnimatedDiv>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

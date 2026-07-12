"use client"

import { AnimatedDiv } from "@/lib/animations"
import Link from "next/link"

const brands = [
  { name: "Apple", desc: "iPhone, MacBook, AirPods", color: "#000000", count: 12 },
  { name: "Samsung", desc: "Galaxy, TV, Électroménager", color: "#1428A0", count: 8 },
  { name: "LG", desc: "TV, Électroménager", color: "#A50034", count: 6 },
  { name: "Sony", desc: "PlayStation, Audio, TV", color: "#000000", count: 4 },
  { name: "iRobot", desc: "Aspirateurs robots", color: "#00A3E0", count: 3 },
  { name: "Dyson", desc: "Aspirateurs, Soin cheveux", color: "#333333", count: 5 },
  { name: "Bose", desc: "Audio, Casques", color: "#000000", count: 4 },
  { name: "Philips", desc: "Électroménager, Beauté", color: "#0B5ED7", count: 7 },
]

export default function BrandsPage() {
  return (
    <div className="w-full min-h-screen bg-[var(--bg-primary)]">
      <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AnimatedDiv fade slideUp className="text-center mb-12">
          <h1 className="text-4xl font-bold text-[var(--text-primary)] mb-2">Marques</h1>
          <p className="text-[var(--text-secondary)]">Les plus grandes marques disponibles sur AXEL</p>
        </AnimatedDiv>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {brands.map((brand, i) => (
            <AnimatedDiv key={brand.name} fade slideUp delay={i * 0.05}>
              <Link href="/produits" className="block p-6 rounded-2xl border-2 border-[var(--border)] hover:border-[var(--border-hover)]/30 hover:shadow-axel-lg transition-all group">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 text-white font-bold text-xl" style={{ backgroundColor: brand.color }}>
                  {brand.name[0]}
                </div>
                <h3 className="font-bold text-[var(--text-primary)] group-hover:text-[var(--text-link)] transition-colors">{brand.name}</h3>
                <p className="text-sm text-[var(--text-secondary)]">{brand.desc}</p>
                <p className="text-xs text-[var(--text-link)] font-semibold mt-2">{brand.count} produits</p>
              </Link>
            </AnimatedDiv>
          ))}
        </div>
      </div>
    </div>
  )
}

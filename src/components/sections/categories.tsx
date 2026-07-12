"use client"

import { useState, useEffect } from "react"
import {
  Smartphone, Laptop, Tv, Refrigerator, Shirt, Sparkles,
  Sofa, Trophy, Car, Building2, ShoppingCart, Settings
} from "lucide-react"
import type { Category } from "@/data/categories"
import { AnimatedDiv } from "@/lib/animations"

const iconMap: Record<string, React.ElementType> = {
  Smartphone, Laptop, Tv, Refrigerator, Shirt, Sparkles,
  Sofa, Trophy, Car, Building2, ShoppingCart, Settings
}

export default function Categories() {
  const [hoveredId, setHoveredId] = useState<number | null>(null)
  const [categories, setCategories] = useState<Category[]>([])

  useEffect(() => {
    fetch("/api/categories").then(r => r.json()).then(d => setCategories(d.categories || []))
  }, [])

  return (
    <section className="py-12 sm:py-16 lg:py-20 bg-[var(--bg-primary)]">
      <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        <AnimatedDiv className="text-center mb-8 sm:mb-12" fade slideUp>
          <span className="text-[var(--text-link)] font-semibold text-xs sm:text-sm tracking-wider uppercase mb-2 block">
            Catégories
          </span>
          <h2 className="text-2xl sm:text-4xl lg:text-4xl font-bold text-[var(--text-primary)]">
            Explorez nos catégories
          </h2>
          <p className="text-[var(--text-secondary)] mt-2 sm:mt-3 max-w-xl mx-auto text-sm sm:text-base">
            Des milliers de produits dans plus de 50 catégories
          </p>
        </AnimatedDiv>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
          {categories.map((cat, index) => {
            const Icon = iconMap[cat.icon]
            const isHovered = hoveredId === cat.id

            return (
              <AnimatedDiv
                key={cat.id}
                fade
                slideUp
                delay={index * 0.05}
              >
                <a
                  href={`/categorie/${cat.slug}`}
                  onMouseEnter={() => setHoveredId(cat.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  className="group relative flex flex-col items-center gap-2 sm:gap-3 p-4 sm:p-6 rounded-2xl border-2 border-[var(--border)] 
                    hover:border-[var(--border-hover)]/30 transition-all duration-300
                    hover:shadow-axel-lg hover:-translate-y-1 block active:scale-95"
                >
                  <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center transition-all duration-300 ${
                    isHovered ? "gradient-axel scale-110" : "bg-[var(--bg-secondary)]"
                  }`}>
                    {Icon && (
                      <Icon className={`w-5 h-5 sm:w-6 sm:h-6 transition-colors duration-300 ${
                        isHovered ? "text-white" : "text-[var(--text-link)]"
                      }`} />
                    )}
                  </div>
                  <div className="text-center">
                    <h3 className={`font-semibold text-xs sm:text-sm transition-colors duration-300 ${
                      isHovered ? "text-[var(--text-link)]" : "text-[var(--text-primary)]"
                    }`}>
                      {cat.name}
                    </h3>
                    <p className="text-[10px] sm:text-xs text-[var(--text-secondary)] mt-0.5 sm:mt-1">Voir la catégorie</p>
                  </div>
                </a>
              </AnimatedDiv>
            )
          })}
        </div>
      </div>
    </section>
  )
}
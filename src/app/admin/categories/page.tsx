"use client"

import { useState, useEffect } from "react"
import {
  Grid3X3, Plus, Smartphone, Laptop, Tv, Snowflake, Shirt, Sparkles,
  Home, Trophy, Car, Building2, ShoppingCart, Wrench
} from "lucide-react"
import { getCategories } from "@/data/categories"
import type { Category } from "@/data/categories"

const iconMap: Record<string, typeof Smartphone> = {
  Smartphone, Laptop, Tv, Refrigerator: Snowflake, Shirt, Sparkles,
  Home, Trophy, Car, Building2, ShoppingCart, Wrench,
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])

  useEffect(() => {
    getCategories().then(setCategories)
  }, [])

  return (
    <div className="p-4 lg:p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Catégories</h1>
          <p className="text-[var(--text-secondary)] text-sm">{categories.length} catégories</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--text-link)] text-white text-sm font-semibold hover:bg-[#0B4FC8] transition-colors">
          <Plus className="w-4 h-4" /> Ajouter
        </button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {categories.map((cat: Category) => {
          const Icon = iconMap[cat.icon] || Grid3X3
          return (
            <div key={cat.id} className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border)] hover:border-[var(--border-hover)]/30 transition-all group">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl bg-[var(--text-link)]/10 flex items-center justify-center group-hover:bg-[var(--text-link)]/20 transition-colors">
                  <Icon className="w-6 h-6 text-[var(--text-link)]" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{cat.name}</p>
                  <p className="text-[10px] text-[var(--text-secondary)]">/{cat.slug}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full bg-[var(--text-link)]/10 text-[10px] font-medium text-[var(--text-link)]">{cat.slug}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

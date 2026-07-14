"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Search, Store, Package, X, Loader2, ArrowRight } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

interface SearchResult {
  shops: Array<{
    id: string
    name: string
    slug: string
    logo: string
    category: string
    rating: number
  }>
  products: Array<{
    id: string
    name: string
    slug: string
    image: string
    price: number
    shop: { name: string; slug: string }
  }>
}

export default function SearchBar({ className }: { className?: string }) {
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResult>({ shops: [], products: [] })
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const allResults = [...results.shops, ...results.products]
  const totalCount = allResults.length

  const search = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults({ shops: [], products: [] })
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`)
      if (!res.ok) { setResults({ shops: [], products: [] }); setLoading(false); return }
      const data = await res.json()
      setResults({
        shops: Array.isArray(data?.shops) ? data.shops : [],
        products: Array.isArray(data?.products) ? data.products : [],
      })
    } catch {
      setResults({ shops: [], products: [] })
    } finally {
      setLoading(false)
    }
  }, [])

  const handleChange = (value: string) => {
    setQuery(value)
    setSelectedIndex(-1)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!value.trim()) {
      setResults({ shops: [], products: [] })
      setOpen(false)
      return
    }
    setOpen(true)
    debounceRef.current = setTimeout(() => search(value), 300)
  }

  const handleSelect = (type: "shop" | "product", slug: string) => {
    setOpen(false)
    setQuery("")
    setResults({ shops: [], products: [] })
    if (type === "shop") {
      router.push(`/boutique/${slug}`)
    } else {
      router.push(`/produit/${slug}`)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open || totalCount === 0) return
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setSelectedIndex(prev => (prev < totalCount - 1 ? prev + 1 : 0))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : totalCount - 1))
    } else if (e.key === "Enter") {
      e.preventDefault()
      if (selectedIndex >= 0 && selectedIndex < totalCount) {
        const item = allResults[selectedIndex]
        const type = selectedIndex < results.shops.length ? "shop" : "product"
        handleSelect(type, item.slug)
      } else if (query.trim()) {
        setOpen(false)
        router.push(`/produits?recherche=${encodeURIComponent(query)}`)
      }
    } else if (e.key === "Escape") {
      setOpen(false)
      inputRef.current?.blur()
    }
  }

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <div className={cn("relative", className)} ref={dropdownRef}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)]" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => handleChange(e.target.value)}
          onFocus={() => query.trim() && setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Rechercher une boutique, un produit..."
          className="w-full rounded-xl border-2 border-[var(--border)] bg-[var(--bg-primary)] pl-10 pr-8 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--border-hover)] focus:outline-none transition-colors"
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)] animate-spin" />
        )}
        {!loading && query && (
          <button
            onClick={() => { setQuery(""); setResults({ shops: [], products: [] }); setOpen(false); inputRef.current?.focus() }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {open && (
        <div className="absolute top-full mt-2 left-0 right-0 bg-[var(--bg-elevated)] border-2 border-[var(--border)] rounded-2xl shadow-xl overflow-hidden z-50 animate-scale-in">
          {loading && totalCount === 0 && (
            <div className="p-4 text-center text-sm text-[var(--text-secondary)]">
              <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
              Recherche en cours...
            </div>
          )}

          {!loading && totalCount === 0 && query.trim() && (
            <div className="p-6 text-center text-sm text-[var(--text-secondary)]">
              Aucun résultat pour &quot;{query}&quot;
            </div>
          )}

          {results.shops.length > 0 && (
            <div>
              <div className="px-4 pt-3 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1.5">
                <Store className="w-3 h-3" /> Boutiques
              </div>
              {results.shops.map((shop, i) => (
                <button
                  key={shop.id}
                  onClick={() => handleSelect("shop", shop.slug)}
                  onMouseEnter={() => setSelectedIndex(i)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left transition-colors ${selectedIndex === i ? "bg-[var(--bg-hover)]" : "hover:bg-[var(--bg-hover)]"}`}
                >
                  <div className="w-8 h-8 rounded-lg bg-[var(--bg-secondary)] overflow-hidden shrink-0 flex items-center justify-center text-[10px] font-bold text-[var(--text-link)]">
                    {shop.logo && !shop.logo.includes("default") ? (
                      <img src={shop.logo} alt="" className="w-full h-full object-cover" />
                    ) : (
                      shop.name.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-[var(--text-primary)] truncate">{shop.name}</p>
                    {shop.category && <p className="text-[11px] text-[var(--text-muted)]">{shop.category}</p>}
                  </div>
                  {shop.rating > 0 && (
                    <span className="flex items-center gap-0.5 shrink-0">
                      {[1, 2, 3, 4, 5].map(i => (
                        <span key={i} className={`text-[10px] ${i <= Math.round(shop.rating) ? "text-yellow-400" : "text-gray-300"}`}>★</span>
                      ))}
                      <span className="text-[11px] text-yellow-500 font-semibold ml-0.5">{shop.rating}</span>
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}

          {results.products.length > 0 && (
            <div>
              <div className="px-4 pt-2 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1.5 border-t border-[var(--border-light)]">
                <Package className="w-3 h-3" /> Produits
              </div>
              {results.products.map((product, i) => (
                <button
                  key={product.id}
                  onClick={() => handleSelect("product", product.slug)}
                  onMouseEnter={() => setSelectedIndex(results.shops.length + i)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left transition-colors ${selectedIndex === results.shops.length + i ? "bg-[var(--bg-hover)]" : "hover:bg-[var(--bg-hover)]"}`}
                >
                  <div className="w-8 h-8 rounded-lg bg-[var(--bg-secondary)] overflow-hidden shrink-0">
                    {product.image && <img src={product.image} alt="" className="w-full h-full object-cover" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-[var(--text-primary)] truncate">{product.name}</p>
                    <p className="text-[11px] text-[var(--text-muted)] truncate">{product.shop.name}</p>
                  </div>
                  <span className="text-[11px] font-semibold text-[var(--text-primary)] shrink-0">
                    {product.price.toLocaleString("fr-FR")} F
                  </span>
                </button>
              ))}
            </div>
          )}

          {query.trim() && (
            <Link
              href={`/produits?recherche=${encodeURIComponent(query)}`}
              onClick={() => { setOpen(false); setQuery(""); setResults({ shops: [], products: [] }) }}
              className="flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-[var(--text-link)] border-t border-[var(--border-light)] hover:bg-[var(--bg-hover)] transition-colors"
            >
              Voir tous les résultats <ArrowRight className="w-4 h-4" />
            </Link>
          )}
        </div>
      )}
    </div>
  )
}

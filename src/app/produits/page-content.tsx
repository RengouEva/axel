"use client"

import { useState, useEffect, Suspense, useCallback } from "react"
import { Search, Grid3X3, List, ChevronLeft, ChevronRight, Star, Store, Heart } from "lucide-react"
import Button from "@/components/ui/button"
import Input from "@/components/ui/input"
import Badge from "@/components/ui/badge"
import type { Product } from "@/data/products"
import type { Category } from "@/data/categories"
import { AnimatedDiv } from "@/lib/animations"
import { useFavorites } from "@/lib/favorites-context"
import { useSearchParams, useRouter, usePathname } from "next/navigation"
import { useCart } from "@/lib/cart-context"
import Link from "next/link"

const ITEMS_PER_PAGE = 6

export default function ProductsPageContent({ products, categories }: { products: Product[]; categories: Category[] }) {
  return (
    <Suspense fallback={<div className="w-full min-h-screen bg-[var(--bg-primary)]" />}>
      <ProductsContent products={products} categories={categories} />
    </Suspense>
  )
}

function ProductsContent({ products, categories }: { products: Product[]; categories: Category[] }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { toggleFavorite, isFavorite } = useFavorites()
  const { addItem } = useCart()

  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get("categorie") || "all")
  const [sortBy, setSortBy] = useState(searchParams.get("tri") || "nouveautes")
  const [searchQuery, setSearchQuery] = useState(searchParams.get("recherche") || "")
  const [page, setPage] = useState(Number(searchParams.get("page")) || 1)

  const updateURL = useCallback((params: Record<string, string>) => {
    const sp = new URLSearchParams(searchParams.toString())
    Object.entries(params).forEach(([k, v]) => {
      if (v && v !== "all" && v !== "nouveautes") sp.set(k, v)
      else sp.delete(k)
    })
    router.replace(`${pathname}?${sp.toString()}`)
  }, [router, pathname, searchParams])

  useEffect(() => {
    const c = searchParams.get("categorie")
    const s = searchParams.get("tri")
    const q = searchParams.get("recherche")
    const p = searchParams.get("page")
    if (c) setSelectedCategory(c)
    if (s) setSortBy(s)
    if (q) setSearchQuery(q)
    if (p) setPage(Number(p))
  }, [searchParams])

  let filtered = selectedCategory === "all"
    ? products
    : products.filter(p => p.category === categories.find(c => c.slug === selectedCategory)?.name)

  if (searchQuery) {
    filtered = filtered.filter(p =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.brand.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }

  filtered.sort((a, b) => {
    if (a.boosted && !b.boosted) return -1
    if (!a.boosted && b.boosted) return 1
    return 0
  })

  switch (sortBy) {
    case "prix-croissant": filtered.sort((a, b) => a.price - b.price); break
    case "prix-decroissant": filtered.sort((a, b) => b.price - a.price); break
    case "note": filtered.sort((a, b) => b.rating - a.rating); break
  }

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE))
  const safePage = Math.min(page, totalPages)
  const paginated = filtered.slice((safePage - 1) * ITEMS_PER_PAGE, safePage * ITEMS_PER_PAGE)

  const goToPage = (p: number) => {
    setPage(p)
    updateURL({ page: String(p) })
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const handleCategoryChange = (cat: string) => {
    setSelectedCategory(cat)
    setPage(1)
    updateURL({ categorie: cat, page: "" })
  }

  const handleSortChange = (s: string) => {
    setSortBy(s)
    setPage(1)
    updateURL({ tri: s, page: "" })
  }

  const handleSearchChange = (q: string) => {
    setSearchQuery(q)
    setPage(1)
    updateURL({ recherche: q, page: "" })
  }

  const handleReset = () => {
    setSearchQuery("")
    setSelectedCategory("all")
    setSortBy("nouveautes")
    setPage(1)
    router.replace(pathname)
  }

  return (
    <div className="w-full min-h-screen bg-[var(--bg-primary)]">
      <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AnimatedDiv fade slideUp>
          <h1 className="text-4xl sm:text-4xl font-bold text-[var(--text-primary)] mb-2">Tous les produits</h1>
          <p className="text-[var(--text-secondary)] mb-8">{filtered.length} produits disponibles</p>
        </AnimatedDiv>

        <div className="flex flex-col lg:flex-row gap-8">
          <aside className="lg:w-64 shrink-0">
            <div className="sticky top-24 space-y-6">
              <div>
                <h3 className="font-semibold text-[var(--text-primary)] mb-3 text-sm">Catégories</h3>
                <div className="space-y-1">
                  <button
                    onClick={() => handleCategoryChange("all")}
                    className={`block w-full text-left px-3 py-2 rounded-xl text-sm transition-colors ${selectedCategory === "all" ? "bg-[var(--text-link)]/10 text-[var(--text-link)] font-semibold" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]"}`}
                  >
                    Toutes les catégories
                  </button>
                  {categories.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => handleCategoryChange(cat.slug)}
                      className={`block w-full text-left px-3 py-2 rounded-xl text-sm transition-colors ${selectedCategory === cat.slug ? "bg-[var(--text-link)]/10 text-[var(--text-link)] font-semibold" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]"}`}
                    >
                      {cat.name}
                      <span className="float-right text-xs opacity-60">{">"}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 p-4 rounded-2xl bg-[var(--bg-secondary)]">
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-64">
                  <Input
                    icon={<Search className="w-4 h-4" />}
                    placeholder="Rechercher..."
                    value={searchQuery}
                    onChange={e => handleSearchChange(e.target.value)}
                    className="bg-[var(--bg-primary)] text-sm"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <select
                  value={sortBy}
                  onChange={e => handleSortChange(e.target.value)}
                  className="px-3 py-2 rounded-xl border-2 border-[var(--border)] text-sm text-[var(--text-primary)] bg-[var(--bg-primary)] focus:border-[var(--border-hover)] focus:outline-none"
                >
                  <option value="nouveautes">Nouveautés</option>
                  <option value="prix-croissant">Prix croissant</option>
                  <option value="prix-decroissant">Prix décroissant</option>
                  <option value="note">Meilleures notes</option>
                </select>
                <div className="flex border-2 border-[var(--border)] rounded-xl overflow-hidden">
                  <button onClick={() => setViewMode("grid")} className={`p-2 ${viewMode === "grid" ? "bg-[var(--text-link)] text-white" : "text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]"}`}>
                    <Grid3X3 className="w-4 h-4" />
                  </button>
                  <button onClick={() => setViewMode("list")} className={`p-2 ${viewMode === "list" ? "bg-[var(--text-link)] text-white" : "text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]"}`}>
                    <List className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {filtered.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-[var(--text-secondary)] text-lg">Aucun produit trouvé</p>
                <Button variant="outline" className="mt-4" onClick={handleReset}>Réinitialiser les filtres</Button>
              </div>
            ) : viewMode === "grid" ? (
              <>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {paginated.map((product, index) => (
                    <AnimatedDiv key={product.id} fade slideUp delay={index * 0.03} className="group bg-[var(--bg-primary)] rounded-2xl border-2 border-[var(--border)] hover:border-transparent hover:shadow-axel-xl transition-all duration-500 hover:-translate-y-2 overflow-hidden">
                      <Link href={`/produit/${product.slug}`} className="relative aspect-square bg-[var(--bg-secondary)] overflow-hidden block">
                        <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                        <div className="absolute top-3 left-3 flex flex-col gap-2">
                          {product.promotion && <Badge variant="promo">Promo</Badge>}
                          <Badge variant="credit">À crédit</Badge>
                        </div>
                        {product.boosted && (
                          <div className="absolute top-3 right-3">
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-yellow-50 text-yellow-700 text-[10px] font-semibold shadow-sm">
                              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                              En vedette
                            </span>
                          </div>
                        )}
                      </Link>
                      <div className="p-4">
                        <p className="text-xs text-[var(--text-link)] font-semibold">{product.brand}</p>
                        {product.shop && <p className="text-[10px] text-[var(--text-muted)] flex items-center gap-1 flex-wrap"><Store className="w-3 h-3" />{product.shop.name}{product.shop.badges?.map(b => <span key={b.type} className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[8px] font-semibold leading-tight" style={{ backgroundColor: b.color + "20", color: b.color }}>{b.label}</span>)}</p>}
                        <Link href={`/produit/${product.slug}`}><h3 className="font-semibold text-[var(--text-primary)] text-sm line-clamp-1 hover:text-[var(--text-link)] transition-colors">{product.name}</h3></Link>
                        <div className="flex items-center gap-1 my-2">
                          <span className="text-yellow-400 text-xs">★</span>
                          <span className="text-xs font-semibold text-[var(--text-primary)]">{product.rating}</span>
                          <span className="text-xs text-[var(--text-secondary)]">({product.reviews})</span>
                        </div>
                        <p className="text-xl font-bold text-[var(--text-primary)]">{product.price.toLocaleString("fr-FR")} F</p>
                        <p className="text-xs text-[var(--text-link)] font-semibold">{product.monthlyPrice.toLocaleString("fr-FR")} F/mois</p>
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

                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-10">
                    <button
                      onClick={() => goToPage(safePage - 1)}
                      disabled={safePage <= 1}
                      className="p-2 rounded-xl border-2 border-[var(--border)] disabled:opacity-30 hover:border-[var(--border-hover)] transition-colors"
                    >
                      <ChevronLeft className="w-5 h-5 text-[var(--text-primary)]" />
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                      <button
                        key={p}
                        onClick={() => goToPage(p)}
                        className={`w-10 h-10 rounded-xl text-sm font-semibold transition-colors ${
                          p === safePage
                            ? "bg-[var(--text-link)] text-white"
                            : "border-2 border-[var(--border)] text-[var(--text-primary)] hover:border-[var(--border-hover)]"
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                    <button
                      onClick={() => goToPage(safePage + 1)}
                      disabled={safePage >= totalPages}
                      className="p-2 rounded-xl border-2 border-[var(--border)] disabled:opacity-30 hover:border-[var(--border-hover)] transition-colors"
                    >
                      <ChevronRight className="w-5 h-5 text-[var(--text-primary)]" />
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="space-y-4">
                {paginated.map((product, index) => (
                  <AnimatedDiv key={product.id} fade slideUp delay={index * 0.03} className="flex gap-4 p-4 rounded-2xl border-2 border-[var(--border)] hover:shadow-axel-lg transition-all relative">
                    {product.boosted && (
                      <div className="absolute top-2 right-2 z-10">
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-yellow-50 text-yellow-700 text-[10px] font-semibold shadow-sm">
                          <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                          En vedette
                        </span>
                      </div>
                    )}
                    <Link href={`/produit/${product.slug}`} className="w-32 h-32 rounded-xl bg-[var(--bg-secondary)] overflow-hidden shrink-0">
                      <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                    </Link>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-[var(--text-link)] font-semibold">{product.brand}</p>
                      {product.shop && <p className="text-xs text-[var(--text-muted)] flex items-center gap-1 flex-wrap"><Store className="w-3 h-3" />{product.shop.name}{product.shop.badges?.map(b => <span key={b.type} className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[8px] font-semibold leading-tight" style={{ backgroundColor: b.color + "20", color: b.color }}>{b.label}</span>)}</p>}
                      <Link href={`/produit/${product.slug}`}><h3 className="font-semibold text-[var(--text-primary)] hover:text-[var(--text-link)] transition-colors">{product.name}</h3></Link>
                      <div className="flex items-center gap-1 my-1">
                        <span className="text-yellow-400 text-xs">★</span>
                        <span className="text-xs font-semibold text-[var(--text-primary)]">{product.rating}</span>
                      </div>
                      <div className="flex items-center gap-3 mt-2">
                        <p className="text-xl font-bold text-[var(--text-primary)]">{product.price.toLocaleString("fr-FR")} F</p>
                        <p className="text-sm text-[var(--text-link)] font-semibold">{product.monthlyPrice.toLocaleString("fr-FR")} F/mois</p>
                      </div>
                      <div className="flex gap-2 mt-2">
                        <Button size="sm" onClick={() => addItem(product)}>Ajouter au panier</Button>
                        <Button size="sm" variant="outline" onClick={() => toggleFavorite(product)}>
                          {isFavorite(product.id) ? "Retirer des favoris" : "Favori"}
                        </Button>
                      </div>
                    </div>
                  </AnimatedDiv>
                ))}

                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-8">
                    <button
                      onClick={() => goToPage(safePage - 1)}
                      disabled={safePage <= 1}
                      className="p-2 rounded-xl border-2 border-[var(--border)] disabled:opacity-30 hover:border-[var(--border-hover)] transition-colors"
                    >
                      <ChevronLeft className="w-5 h-5 text-[var(--text-primary)]" />
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                      <button
                        key={p}
                        onClick={() => goToPage(p)}
                        className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                          p === safePage
                            ? "bg-[var(--text-link)] text-white"
                            : "border-2 border-[var(--border)] text-[var(--text-primary)] hover:border-[var(--border-hover)]"
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                    <button
                      onClick={() => goToPage(safePage + 1)}
                      disabled={safePage >= totalPages}
                      className="p-2 rounded-xl border-2 border-[var(--border)] disabled:opacity-30 hover:border-[var(--border-hover)] transition-colors"
                    >
                      <ChevronRight className="w-5 h-5 text-[var(--text-primary)]" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

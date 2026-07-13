"use client"

import { createContext, useContext, useCallback, useMemo, type ReactNode } from "react"
import { useLocalStorage } from "@/lib/use-local-storage"
import type { Product } from "@/data/product-types"

interface FavoritesContextType {
  items: Product[]
  toggleFavorite: (product: Product) => void
  isFavorite: (productId: number) => boolean
  removeFavorite: (productId: number) => void
  favoriteIds: Set<number>
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined)
const STORAGE_KEY = "axel-favorites"

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useLocalStorage<Product[]>(STORAGE_KEY, [])

  const favoriteIds = useMemo(() => new Set(items.map((p) => p.id)), [items])

  const toggleFavorite = useCallback((product: Product) => {
    setItems((prev) => {
      if (prev.some((p) => p.id === product.id)) {
        return prev.filter((p) => p.id !== product.id)
      }
      return [...prev, product]
    })
  }, [setItems])

  const isFavorite = useCallback((productId: number) => {
    return favoriteIds.has(productId)
  }, [favoriteIds])

  const removeFavorite = useCallback((productId: number) => {
    setItems((prev) => prev.filter((p) => p.id !== productId))
  }, [setItems])

  const value = useMemo(
    () => ({ items, toggleFavorite, isFavorite, removeFavorite, favoriteIds }),
    [items, toggleFavorite, isFavorite, removeFavorite, favoriteIds]
  )

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  )
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext)
  if (!ctx) throw new Error("useFavorites must be used within a FavoritesProvider")
  return ctx
}

"use client"

import { createContext, useContext, useCallback, useMemo, type ReactNode } from "react"
import { useLocalStorage } from "@/lib/use-local-storage"
import type { Product } from "@/data/products"

interface CompareContextType {
  items: Product[]
  addItem: (product: Product) => void
  removeItem: (productId: number) => void
  clearAll: () => void
  isInCompare: (productId: number) => boolean
  compareIds: Set<number>
}

const CompareContext = createContext<CompareContextType | undefined>(undefined)
const STORAGE_KEY = "axel-compare"
const MAX_COMPARE = 4

export function CompareProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useLocalStorage<Product[]>(STORAGE_KEY, [])

  const compareIds = useMemo(() => new Set(items.map((p) => p.id)), [items])

  const addItem = useCallback((product: Product) => {
    setItems((prev) => {
      if (prev.some((p) => p.id === product.id)) return prev
      if (prev.length >= MAX_COMPARE) return prev
      return [...prev, product]
    })
  }, [setItems])

  const removeItem = useCallback((productId: number) => {
    setItems((prev) => prev.filter((p) => p.id !== productId))
  }, [setItems])

  const clearAll = useCallback(() => setItems([]), [setItems])

  const isInCompare = useCallback((productId: number) => {
    return compareIds.has(productId)
  }, [compareIds])

  const value = useMemo(
    () => ({ items, addItem, removeItem, clearAll, isInCompare, compareIds }),
    [items, addItem, removeItem, clearAll, isInCompare, compareIds]
  )

  return (
    <CompareContext.Provider value={value}>
      {children}
    </CompareContext.Provider>
  )
}

export function useCompare() {
  const ctx = useContext(CompareContext)
  if (!ctx) throw new Error("useCompare must be used within a CompareProvider")
  return ctx
}

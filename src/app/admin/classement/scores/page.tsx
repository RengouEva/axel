"use client"

import { useEffect, useState, useCallback } from "react"
import toast from "react-hot-toast"
import { ArrowLeft, Loader2, RefreshCw, Package, Star } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import Button from "@/components/ui/button"

interface ScoreItem {
  id: number
  productId: number
  productName: string
  productImage: string
  category: string
  price: number
  scoreTotal: number
  relevance: number
  quality: number
  freshness: number
  availability: number
  priceScore: number
  calculatedAt: string
}

interface ScoresResponse {
  scores: ScoreItem[]
  total: number
  page: number
  totalPages: number
}

export default function ClassementScoresPage() {
  const { getAuthHeaders } = useAuth()
  const [data, setData] = useState<ScoresResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [page, setPage] = useState(1)
  const limit = 50

  const fetchScores = useCallback(async () => {
    const headers = getAuthHeaders()
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/classement/scores?page=${page}&limit=${limit}`, { headers })
      if (!res.ok) throw new Error("Erreur")
      const json = await res.json()
      setData(json)
    } catch {
      toast.error("Erreur lors du chargement des scores")
    } finally {
      setLoading(false)
    }
  }, [getAuthHeaders, page])

  useEffect(() => { fetchScores() }, [fetchScores])

  const handleRefresh = async () => {
    const headers = getAuthHeaders()
    setRefreshing(true)
    try {
      const res = await fetch("/api/admin/classement/scores", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...headers },
        body: JSON.stringify({ action: "refresh" }),
      })
      if (!res.ok) throw new Error("Erreur")
      toast.success("Cache rafraîchi avec succès")
      fetchScores()
    } catch {
      toast.error("Erreur lors du rafraîchissement du cache")
    } finally {
      setRefreshing(false)
    }
  }

  return (
    <div className="p-4 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin" className="p-2 rounded-xl bg-[var(--bg-card)] border border-[var(--border)] hover:border-[var(--border-hover)]/30 transition-colors">
            <ArrowLeft className="w-5 h-5 text-[var(--text-muted)]" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">Scores de Classement</h1>
            <p className="text-sm text-[var(--text-secondary)]">Classement organique des produits</p>
          </div>
        </div>
        <Button onClick={handleRefresh} disabled={refreshing} variant="outline" size="sm">
          {refreshing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          Rafraîchir le cache
        </Button>
      </div>

      {loading ? (
        <LoadingSpinner className="py-20" size="lg" />
      ) : !data || data.scores.length === 0 ? (
        <div className="text-center py-12 bg-[var(--bg-card)] rounded-2xl border border-[var(--border)]">
          <Star className="w-12 h-12 text-[#1E293B] mx-auto mb-4" />
          <p className="text-[var(--text-secondary)]">Aucun score trouvé</p>
        </div>
      ) : (
        <>
          <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] overflow-hidden">
            <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-[var(--bg-primary)] border-b border-[var(--border)] text-xs font-semibold text-[var(--text-secondary)]">
              <div className="col-span-2">Produit</div>
              <div className="col-span-1">Catégorie</div>
              <div className="col-span-1">Prix</div>
              <div className="col-span-1">Score Total</div>
              <div className="col-span-1">Relevance</div>
              <div className="col-span-1">Quality</div>
              <div className="col-span-1">Freshness</div>
              <div className="col-span-1">Availability</div>
              <div className="col-span-1">Price</div>
              <div className="col-span-2">Calculé le</div>
            </div>
            {data.scores.map((s) => (
              <div key={s.id} className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-[var(--border)] last:border-0 items-center hover:bg-[var(--bg-primary)]/50 transition-colors">
                <div className="col-span-2 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[var(--bg-elevated)] overflow-hidden flex-shrink-0 flex items-center justify-center">
                    {s.productImage ? (
                      <img src={s.productImage} alt={s.productName} className="w-full h-full object-contain" />
                    ) : (
                      <Package className="w-5 h-5 text-[var(--text-muted)]" />
                    )}
                  </div>
                  <span className="text-sm font-semibold text-white truncate">{s.productName}</span>
                </div>
                <div className="col-span-1 text-xs text-[var(--text-muted)]">{s.category}</div>
                <div className="col-span-1 text-sm font-bold text-white">{s.price.toLocaleString("fr-FR")} F</div>
                <div className="col-span-1 text-sm font-bold text-[var(--text-link)]">{s.scoreTotal?.toFixed(2)}</div>
                <div className="col-span-1 text-xs text-[var(--text-secondary)]">{s.relevance?.toFixed(2)}</div>
                <div className="col-span-1 text-xs text-[var(--text-secondary)]">{s.quality?.toFixed(2)}</div>
                <div className="col-span-1 text-xs text-[var(--text-secondary)]">{s.freshness?.toFixed(2)}</div>
                <div className="col-span-1 text-xs text-[var(--text-secondary)]">{s.availability?.toFixed(2)}</div>
                <div className="col-span-1 text-xs text-[var(--text-secondary)]">{s.priceScore?.toFixed(2)}</div>
                <div className="col-span-2 text-xs text-[var(--text-secondary)]">{new Date(s.calculatedAt).toLocaleString("fr-FR")}</div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between">
            <p className="text-xs text-[var(--text-secondary)]">
              {data.total} résultat{data.total > 1 ? "s" : ""}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-[var(--bg-card)] border border-[var(--border)] text-white disabled:opacity-40 hover:border-[var(--border-hover)]/30 transition-colors"
              >
                Précédent
              </button>
              <span className="text-xs text-[var(--text-secondary)]">Page {data.page} sur {data.totalPages}</span>
              <button
                onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                disabled={page >= data.totalPages}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-[var(--bg-card)] border border-[var(--border)] text-white disabled:opacity-40 hover:border-[var(--border-hover)]/30 transition-colors"
              >
                Suivant
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

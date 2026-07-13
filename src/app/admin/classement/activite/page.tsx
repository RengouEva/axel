"use client"

import { useEffect, useState, useCallback } from "react"
import toast from "react-hot-toast"
import { ArrowLeft, Loader2, Store, Package } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { LoadingSpinner } from "@/components/ui/loading-spinner"

interface ActiviteItem {
  id: number
  shopName: string
  sellerName: string
  email: string
  totalOrders: number
  completedOrders: number
  cancellationRate: number
  avgResponseTime: number
  isAvailable: boolean
  lastActivity: string
}

interface ActiviteResponse {
  sellers: ActiviteItem[]
  total: number
  page: number
  totalPages: number
}

export default function ClassementActivitePage() {
  const { getAuthHeaders } = useAuth()
  const [data, setData] = useState<ActiviteResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const limit = 50

  const fetchActivite = useCallback(async () => {
    const headers = getAuthHeaders()
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/classement/activite?page=${page}&limit=${limit}`, { headers })
      if (!res.ok) throw new Error("Erreur")
      const json = await res.json()
      setData(json)
    } catch {
      toast.error("Erreur lors du chargement de l'activité")
    } finally {
      setLoading(false)
    }
  }, [getAuthHeaders, page])

  useEffect(() => { fetchActivite() }, [fetchActivite])

  return (
    <div className="p-4 lg:p-8 space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin" className="p-2 rounded-xl bg-[var(--bg-card)] border border-[var(--border)] hover:border-[var(--border-hover)]/30 transition-colors">
          <ArrowLeft className="w-5 h-5 text-[var(--text-muted)]" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">Activité Vendeurs</h1>
          <p className="text-sm text-[var(--text-secondary)]">Performance et activité des vendeurs</p>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner className="py-20" size="lg" />
      ) : !data || data.sellers.length === 0 ? (
        <div className="text-center py-12 bg-[var(--bg-card)] rounded-2xl border border-[var(--border)]">
          <Store className="w-12 h-12 text-[#1E293B] mx-auto mb-4" />
          <p className="text-[var(--text-secondary)]">Aucun vendeur trouvé</p>
        </div>
      ) : (
        <>
          <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] overflow-hidden">
            <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-[var(--bg-primary)] border-b border-[var(--border)] text-xs font-semibold text-[var(--text-secondary)]">
              <div className="col-span-2">Boutique</div>
              <div className="col-span-2">Vendeur</div>
              <div className="col-span-2">Email</div>
              <div className="col-span-1">Commandes</div>
              <div className="col-span-1">Annulation</div>
              <div className="col-span-1">Tps Réponse</div>
              <div className="col-span-1">Dispo</div>
              <div className="col-span-2">Dernière Activité</div>
            </div>
            {data.sellers.map((s) => (
              <div key={s.id} className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-[var(--border)] last:border-0 items-center hover:bg-[var(--bg-primary)]/50 transition-colors">
                <div className="col-span-2 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#059669]/15 flex items-center justify-center">
                    <Store className="w-4 h-4 text-[var(--text-success)]" />
                  </div>
                  <span className="text-sm font-semibold text-white">{s.shopName}</span>
                </div>
                <div className="col-span-2 text-sm text-white font-semibold">{s.sellerName}</div>
                <div className="col-span-2 text-xs text-[var(--text-muted)]">{s.email}</div>
                <div className="col-span-1 text-xs text-[var(--text-secondary)]">
                  {s.completedOrders}/{s.totalOrders}
                </div>
                <div className="col-span-1 text-xs">
                  <span className={`font-semibold ${s.cancellationRate > 10 ? "text-red-400" : "text-[var(--text-secondary)]"}`}>
                    {s.cancellationRate?.toFixed(1)}%
                  </span>
                </div>
                <div className="col-span-1 text-xs text-[var(--text-secondary)]">
                  {s.avgResponseTime ? `${s.avgResponseTime}h` : "-"}
                </div>
                <div className="col-span-1">
                  <span className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold ${s.isAvailable ? "text-green-400 bg-green-500/10" : "text-red-400 bg-red-500/10"}`}>
                    {s.isAvailable ? "Oui" : "Non"}
                  </span>
                </div>
                <div className="col-span-2 text-xs text-[var(--text-secondary)]">
                  {s.lastActivity ? new Date(s.lastActivity).toLocaleString("fr-FR") : "-"}
                </div>
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

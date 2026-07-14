"use client"

import { useEffect, useState, useCallback } from "react"
import toast from "react-hot-toast"
import { ArrowLeft, Loader2, Key, Store } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { LoadingSpinner } from "@/components/ui/loading-spinner"

interface ApiKeyItem {
  id: string
  shopId: string
  shopName: string
  name: string
  keyPrefix: string
  lastUsedAt: string | null
  expiresAt: string | null
  isActive: number
  createdAt: string
}

interface ApiKeysResponse {
  keys: ApiKeyItem[]
  total: number
  page: number
  totalPages: number
}

export default function AdminApiKeysPage() {
  const { getAuthHeaders } = useAuth()
  const [data, setData] = useState<ApiKeysResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const limit = 50

  const fetchData = useCallback(async () => {
    const headers = getAuthHeaders()
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/services-pro/api-keys?page=${page}&limit=${limit}`, { headers })
      if (!res.ok) throw new Error("Erreur")
      const json = await res.json()
      setData(json)
    } catch {
      toast.error("Erreur lors du chargement des clés API")
    } finally {
      setLoading(false)
    }
  }, [getAuthHeaders, page])

  useEffect(() => { fetchData() }, [fetchData])

  return (
    <div className="p-4 lg:p-8 space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin" className="p-2 rounded-xl bg-[var(--bg-card)] border border-[var(--border)] hover:border-[var(--border-hover)]/30 transition-colors">
          <ArrowLeft className="w-5 h-5 text-[var(--text-muted)]" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">Clés API</h1>
          <p className="text-sm text-[var(--text-secondary)]">Gestion des clés API des vendeurs</p>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner className="py-20" size="lg" />
      ) : !data || data.keys.length === 0 ? (
        <div className="text-center py-12 bg-[var(--bg-card)] rounded-2xl border border-[var(--border)]">
          <Key className="w-12 h-12 text-[#1E293B] mx-auto mb-4" />
          <p className="text-[var(--text-secondary)]">Aucune clé API trouvée</p>
        </div>
      ) : (
        <>
          <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] overflow-x-auto">
            <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-[var(--bg-primary)] border-b border-[var(--border)] text-xs font-semibold text-[var(--text-secondary)] sticky top-0 z-10">
              <div className="col-span-2">Boutique</div>
              <div className="col-span-2">Nom</div>
              <div className="col-span-2">Préfixe</div>
              <div className="col-span-2">Dernière utilisation</div>
              <div className="col-span-2">Expire le</div>
              <div className="col-span-2">Statut</div>
            </div>
            {data.keys.map((k) => (
              <div key={k.id} className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-[var(--border)] last:border-0 items-center hover:bg-[var(--bg-primary)]/50 transition-colors">
                <div className="col-span-2 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#059669]/15 flex items-center justify-center">
                    <Store className="w-4 h-4 text-[var(--text-success)]" />
                  </div>
                  <span className="text-sm font-semibold text-white">{k.shopName || "-"}</span>
                </div>
                <div className="col-span-2 text-sm text-white">{k.name}</div>
                <div className="col-span-2 text-xs font-mono text-[var(--text-muted)]">{k.keyPrefix}...</div>
                <div className="col-span-2 text-xs text-[var(--text-secondary)]">
                  {k.lastUsedAt ? new Date(k.lastUsedAt).toLocaleString("fr-FR") : "Jamais"}
                </div>
                <div className="col-span-2 text-xs text-[var(--text-secondary)]">
                  {k.expiresAt ? new Date(k.expiresAt).toLocaleDateString("fr-FR") : "Jamais"}
                </div>
                <div className="col-span-2">
                  <span className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold ${k.isActive ? "text-green-400 bg-green-500/10" : "text-red-400 bg-red-500/10"}`}>
                    {k.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between">
            <p className="text-xs text-[var(--text-secondary)]">
              {data.total} résultat{data.total > 1 ? "s" : ""}
            </p>
            <div className="flex items-center gap-2">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-[var(--bg-card)] border border-[var(--border)] text-white disabled:opacity-40 hover:border-[var(--border-hover)]/30 transition-colors">
                Précédent
              </button>
              <span className="text-xs text-[var(--text-secondary)]">Page {data.page} sur {data.totalPages}</span>
              <button onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))} disabled={page >= data.totalPages}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-[var(--bg-card)] border border-[var(--border)] text-white disabled:opacity-40 hover:border-[var(--border-hover)]/30 transition-colors">
                Suivant
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

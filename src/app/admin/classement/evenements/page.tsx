"use client"

import { useEffect, useState, useCallback } from "react"
import toast from "react-hot-toast"
import { ArrowLeft, Loader2, Activity, Search, Package } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { LoadingSpinner } from "@/components/ui/loading-spinner"

interface EventItem {
  id: number
  productId: number
  productName: string
  productImage: string
  event: string
  userId: number
  userName: string
  sessionId: string
  ipAddress: string
  createdAt: string
}

interface EventsResponse {
  events: EventItem[]
  total: number
  page: number
  totalPages: number
}

const EVENT_LABELS: Record<string, string> = {
  view: "Vue",
  click: "Clic",
  favorite: "Favori",
  cart_add: "Ajout panier",
  purchase: "Achat",
}

const EVENT_COLORS: Record<string, string> = {
  view: "text-blue-400 bg-blue-500/10",
  click: "text-purple-400 bg-purple-500/10",
  favorite: "text-rose-400 bg-rose-500/10",
  cart_add: "text-amber-400 bg-amber-500/10",
  purchase: "text-green-400 bg-green-500/10",
}

export default function ClassementEvenementsPage() {
  const { getAuthHeaders } = useAuth()
  const [data, setData] = useState<EventsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [eventFilter, setEventFilter] = useState("")
  const [searchProduct, setSearchProduct] = useState("")
  const limit = 50

  const fetchEvents = useCallback(async () => {
    const headers = getAuthHeaders()
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: page.toString(), limit: limit.toString() })
      if (eventFilter) params.set("event", eventFilter)
      if (searchProduct) params.set("productId", searchProduct)
      const res = await fetch(`/api/admin/classement/evenements?${params}`, { headers })
      if (!res.ok) throw new Error("Erreur")
      const json = await res.json()
      setData(json)
    } catch {
      toast.error("Erreur lors du chargement des événements")
    } finally {
      setLoading(false)
    }
  }, [getAuthHeaders, page, eventFilter, searchProduct])

  useEffect(() => { fetchEvents() }, [fetchEvents])

  return (
    <div className="p-4 lg:p-8 space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin" className="p-2 rounded-xl bg-[var(--bg-card)] border border-[var(--border)] hover:border-[var(--border-hover)]/30 transition-colors">
          <ArrowLeft className="w-5 h-5 text-[var(--text-muted)]" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">Événements Produits</h1>
          <p className="text-sm text-[var(--text-secondary)]">Historique des interactions utilisateurs</p>
        </div>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
          <input
            type="text"
            value={searchProduct}
            onChange={(e) => { setSearchProduct(e.target.value); setPage(1) }}
            placeholder="Rechercher par produit..."
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-card)] pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--border-hover)]/30 transition-colors"
          />
        </div>
        <select
          value={eventFilter}
          onChange={(e) => { setEventFilter(e.target.value); setPage(1) }}
          className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[var(--border-hover)]/30 transition-colors"
        >
          <option value="">Tous les événements</option>
          {Object.entries(EVENT_LABELS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <LoadingSpinner className="py-20" size="lg" />
      ) : !data || data.events.length === 0 ? (
        <div className="text-center py-12 bg-[var(--bg-card)] rounded-2xl border border-[var(--border)]">
          <Activity className="w-12 h-12 text-[#1E293B] mx-auto mb-4" />
          <p className="text-[var(--text-secondary)]">Aucun événement trouvé</p>
        </div>
      ) : (
        <>
          <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] overflow-hidden">
            <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-[var(--bg-primary)] border-b border-[var(--border)] text-xs font-semibold text-[var(--text-secondary)]">
              <div className="col-span-1">ID</div>
              <div className="col-span-2">Produit</div>
              <div className="col-span-2">Événement</div>
              <div className="col-span-2">Utilisateur</div>
              <div className="col-span-2">Session</div>
              <div className="col-span-1">IP</div>
              <div className="col-span-2">Date</div>
            </div>
            {data.events.map((e) => (
              <div key={e.id} className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-[var(--border)] last:border-0 items-center hover:bg-[var(--bg-primary)]/50 transition-colors">
                <div className="col-span-1 text-xs text-[var(--text-muted)] font-mono">{e.id}</div>
                <div className="col-span-2 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[var(--bg-elevated)] overflow-hidden flex-shrink-0 flex items-center justify-center">
                    {e.productImage ? (
                      <img src={e.productImage} alt={e.productName} className="w-full h-full object-contain" />
                    ) : (
                      <Package className="w-4 h-4 text-[var(--text-muted)]" />
                    )}
                  </div>
                  <span className="text-sm font-semibold text-white truncate">{e.productName}</span>
                </div>
                <div className="col-span-2">
                  <span className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold ${EVENT_COLORS[e.event] || "text-[var(--text-secondary)] bg-[var(--bg-elevated)]"}`}>
                    {EVENT_LABELS[e.event] || e.event}
                  </span>
                </div>
                <div className="col-span-2 text-sm text-[var(--text-muted)]">{e.userName || "-"}</div>
                <div className="col-span-2 text-xs text-[var(--text-secondary)] font-mono truncate">{e.sessionId || "-"}</div>
                <div className="col-span-1 text-xs text-[var(--text-muted)] font-mono">{e.ipAddress || "-"}</div>
                <div className="col-span-2 text-xs text-[var(--text-secondary)]">{new Date(e.createdAt).toLocaleString("fr-FR")}</div>
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

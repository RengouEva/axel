"use client"

import { useEffect, useState, useCallback } from "react"
import toast from "react-hot-toast"
import { ArrowLeft, Loader2, Bell, Store } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { LoadingSpinner } from "@/components/ui/loading-spinner"

interface NotificationItem {
  id: string
  shopId: string
  shopName: string
  type: string
  title: string
  isRead: number
  createdAt: string
}

interface NotificationsResponse {
  notifications: NotificationItem[]
  total: number
  page: number
  totalPages: number
}

const TYPE_LABELS: Record<string, string> = {
  new_order: "Nouvelle commande",
  payment_received: "Paiement reçu",
  low_stock: "Stock faible",
  return_request: "Demande de retour",
  new_message: "Nouveau message",
  new_review: "Nouvel avis",
  performance: "Performance",
  system: "Système",
}

const TYPE_COLORS: Record<string, string> = {
  new_order: "text-blue-400 bg-blue-500/10",
  payment_received: "text-green-400 bg-green-500/10",
  low_stock: "text-amber-400 bg-amber-500/10",
  return_request: "text-purple-400 bg-purple-500/10",
  new_message: "text-cyan-400 bg-cyan-500/10",
  new_review: "text-pink-400 bg-pink-500/10",
  performance: "text-orange-400 bg-orange-500/10",
  system: "text-[var(--text-secondary)] bg-[var(--bg-primary)]",
}

export default function AdminNotificationsPage() {
  const { getAuthHeaders } = useAuth()
  const [data, setData] = useState<NotificationsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [typeFilter, setTypeFilter] = useState("")
  const limit = 50

  const fetchData = useCallback(async () => {
    const headers = getAuthHeaders()
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) })
      if (typeFilter) params.set("type", typeFilter)
      const res = await fetch(`/api/admin/services-pro/notifications?${params}`, { headers })
      if (!res.ok) throw new Error("Erreur")
      const json = await res.json()
      setData(json)
    } catch {
      toast.error("Erreur lors du chargement des notifications")
    } finally {
      setLoading(false)
    }
  }, [getAuthHeaders, page, typeFilter])

  useEffect(() => { fetchData() }, [fetchData])

  return (
    <div className="p-4 lg:p-8 space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin" className="p-2 rounded-xl bg-[var(--bg-card)] border border-[var(--border)] hover:border-[var(--border-hover)]/30 transition-colors">
          <ArrowLeft className="w-5 h-5 text-[var(--text-muted)]" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">Notifications Vendeurs</h1>
          <p className="text-sm text-[var(--text-secondary)]">Toutes les notifications envoyées aux vendeurs</p>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        {["", ...Object.keys(TYPE_LABELS)].map((t) => (
          <button
            key={t}
            onClick={() => { setPage(1); setTypeFilter(t) }}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
              typeFilter === t
                ? "bg-[var(--text-link)] text-white"
                : "bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--border-hover)]/30"
            }`}
          >
            {t ? TYPE_LABELS[t] : "Tous"}
          </button>
        ))}
      </div>

      {loading ? (
        <LoadingSpinner className="py-20" size="lg" />
      ) : !data || data.notifications.length === 0 ? (
        <div className="text-center py-12 bg-[var(--bg-card)] rounded-2xl border border-[var(--border)]">
          <Bell className="w-12 h-12 text-[#1E293B] mx-auto mb-4" />
          <p className="text-[var(--text-secondary)]">Aucune notification trouvée</p>
        </div>
      ) : (
        <>
          <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] overflow-x-auto">
            <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-[var(--bg-primary)] border-b border-[var(--border)] text-xs font-semibold text-[var(--text-secondary)] sticky top-0 z-10">
              <div className="col-span-3">Boutique</div>
              <div className="col-span-2">Type</div>
              <div className="col-span-4">Titre</div>
              <div className="col-span-1">Lu</div>
              <div className="col-span-2">Date</div>
            </div>
            {data.notifications.map((n) => (
              <div key={n.id} className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-[var(--border)] last:border-0 items-center hover:bg-[var(--bg-primary)]/50 transition-colors">
                <div className="col-span-3 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#059669]/15 flex items-center justify-center">
                    <Store className="w-4 h-4 text-[var(--text-success)]" />
                  </div>
                  <span className="text-sm font-semibold text-white">{n.shopName || "-"}</span>
                </div>
                <div className="col-span-2">
                  <span className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold ${TYPE_COLORS[n.type] || TYPE_COLORS.system}`}>
                    {TYPE_LABELS[n.type] || n.type}
                  </span>
                </div>
                <div className="col-span-4 text-sm text-[var(--text-muted)] truncate">{n.title}</div>
                <div className="col-span-1 text-xs">
                  <span className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold ${n.isRead ? "text-[var(--text-secondary)] bg-[var(--bg-primary)]" : "text-blue-400 bg-blue-500/10"}`}>
                    {n.isRead ? "Oui" : "Non"}
                  </span>
                </div>
                <div className="col-span-2 text-xs text-[var(--text-secondary)]">{new Date(n.createdAt).toLocaleDateString("fr-FR")}</div>
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

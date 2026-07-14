"use client"

import { useState, useEffect, useCallback } from "react"
import { Bell, CheckCheck, Filter, Loader2 } from "lucide-react"
import Button from "@/components/ui/button"
import toast from "react-hot-toast"
import { useAuth } from "@/lib/auth-context"
import type { SellerNotification } from "@/lib/services-pro-types"

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

export default function NotificationsPage() {
  const { getAuthHeaders } = useAuth()
  const [notifications, setNotifications] = useState<SellerNotification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [typeFilter, setTypeFilter] = useState("")
  const limit = 20

  const loadNotifications = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) })
      if (typeFilter) params.set("type", typeFilter)
      const res = await fetch(`/api/vendeur/services-pro/notifications?${params}`, { headers: getAuthHeaders() })
      const data: { notifications?: SellerNotification[]; unreadCount?: number; total?: number; error?: string } = await res.json()
      if (!res.ok) { toast.error(data.error || "Une erreur est survenue"); return }
      setNotifications(data.notifications || [])
      setUnreadCount(data.unreadCount || 0)
      setTotal(data.total || 0)
    } catch {
      toast.error("Erreur lors du chargement")
    } finally {
      setLoading(false)
    }
  }, [getAuthHeaders, page, typeFilter])

  useEffect(() => { loadNotifications() }, [loadNotifications])

  const markAllRead = async () => {
    const res = await fetch("/api/vendeur/services-pro/notifications", {
      method: "POST", headers: { "Content-Type": "application/json", ...getAuthHeaders() },
      body: JSON.stringify({ action: "mark_all_read" }),
    })
    if (!res.ok) { toast.error("Erreur"); return }
    toast.success("Toutes marquées comme lues")
    loadNotifications()
  }

  const typeKeys = Object.keys(TYPE_LABELS)

  return (
    <div className="w-full min-h-screen bg-[var(--bg-secondary)] p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Bell className="w-8 h-8 text-[var(--text-link)]" />
            <div>
              <h1 className="text-2xl font-bold text-[var(--text-primary)]">Notifications</h1>
              <p className="text-sm text-[var(--text-secondary)]">Restez informé en temps réel</p>
            </div>
          </div>
          {unreadCount > 0 && (
            <Button onClick={markAllRead} size="sm">
              <CheckCheck className="w-4 h-4" /> Tout marquer comme lu
            </Button>
          )}
        </div>

        <div className="flex gap-2 mb-6 flex-wrap items-center">
          <Filter className="w-4 h-4 text-[var(--text-secondary)]" />
          <button onClick={() => { setPage(1); setTypeFilter("") }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium ${!typeFilter ? "bg-[var(--text-link)] text-white" : "bg-[var(--bg-primary)] text-[var(--text-secondary)] border border-[var(--border)]"}`}>Tous</button>
          {typeKeys.map(t => (
            <button key={t} onClick={() => { setPage(1); setTypeFilter(t) }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium ${typeFilter === t ? "bg-[var(--text-link)] text-white" : "bg-[var(--bg-primary)] text-[var(--text-secondary)] border border-[var(--border)]"}`}>{TYPE_LABELS[t]}</button>
          ))}
        </div>

        <div className="bg-[var(--bg-primary)] rounded-2xl border-2 border-[var(--border)]">
          {loading ? (
            <div className="p-12 text-center flex justify-center">
              <Loader2 className="w-8 h-8 animate-spin" style={{ color: "var(--text-link)" }} />
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-12 text-center">
              <Bell className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-1">Aucune notification</h3>
              <p className="text-sm text-[var(--text-secondary)]">Il n'y a aucune notification à afficher pour le moment.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-[var(--border)] text-xs font-semibold text-[var(--text-secondary)]">
                <div className="col-span-2">Type</div>
                <div className="col-span-3">Titre</div>
                <div className="col-span-4">Message</div>
                <div className="col-span-1">Lu</div>
                <div className="col-span-2">Date</div>
              </div>
              {notifications.map((n: SellerNotification) => (
                <div key={n.id} className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-[var(--border)] last:border-0 items-center hover:bg-[var(--bg-secondary)]/50 transition-colors">
                  <div className="col-span-2">
                    <span className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold ${TYPE_COLORS[n.type] || TYPE_COLORS.system}`}>
                      {TYPE_LABELS[n.type] || n.type}
                    </span>
                  </div>
                  <div className="col-span-3 text-sm font-medium text-[var(--text-primary)] truncate">{n.title}</div>
                  <div className="col-span-4 text-sm text-[var(--text-secondary)] truncate">{n.message || "-"}</div>
                  <div className="col-span-1">
                    <span className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold ${n.isRead ? "text-[var(--text-secondary)] bg-[var(--bg-primary)]" : "text-blue-400 bg-blue-500/10"}`}>
                      {n.isRead ? "Oui" : "Non"}
                    </span>
                  </div>
                  <div className="col-span-2 text-xs text-[var(--text-secondary)]">{new Date(n.createdAt).toLocaleDateString("fr-FR")}</div>
                </div>
              ))}
            </>
          )}
        </div>

        {total > limit && (
          <div className="flex items-center justify-between mt-4">
            <p className="text-xs text-[var(--text-secondary)]">{total} notification{total > 1 ? "s" : ""}</p>
            <div className="flex items-center gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-primary)] disabled:opacity-40">Précédent</button>
              <span className="text-xs text-[var(--text-secondary)]">Page {page}</span>
              <button onClick={() => setPage(p => p + 1)} disabled={notifications.length < limit}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-primary)] disabled:opacity-40">Suivant</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

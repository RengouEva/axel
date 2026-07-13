"use client"

import { useEffect, useState, useCallback } from "react"
import toast from "react-hot-toast"
import { ArrowLeft, Loader2, ShoppingBag, X, Check, Ban, RotateCcw } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { LoadingSpinner } from "@/components/ui/loading-spinner"

interface RetourItem {
  id: string
  orderId: string
  productName: string
  shopName: string
  clientName: string
  clientEmail: string
  refundAmount: number | null
  status: string
  reason: string
  createdAt: string
}

interface RetoursResponse {
  retours: RetourItem[]
  total: number
  page: number
  totalPages: number
}

const STATUS_LABELS: Record<string, string> = {
  pending: "En attente",
  approved: "Approuvé",
  rejected: "Rejeté",
  picked_up: "Récupéré",
  received: "Reçu",
  refunded: "Remboursé",
  cancelled: "Annulé",
}

const STATUS_COLORS: Record<string, string> = {
  pending: "text-amber-400 bg-amber-500/10",
  approved: "text-blue-400 bg-blue-500/10",
  rejected: "text-red-400 bg-red-500/10",
  picked_up: "text-purple-400 bg-purple-500/10",
  received: "text-cyan-400 bg-cyan-500/10",
  refunded: "text-green-400 bg-green-500/10",
  cancelled: "text-[var(--text-secondary)] bg-[var(--bg-primary)]",
}

export default function AdminRetoursPage() {
  const { getAuthHeaders } = useAuth()
  const [data, setData] = useState<RetoursResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState("")
  const limit = 50

  const [actionModal, setActionModal] = useState<{ item: RetourItem; action: string } | null>(null)
  const [rejectReason, setRejectReason] = useState("")
  const [saving, setSaving] = useState(false)

  const fetchData = useCallback(async () => {
    const headers = getAuthHeaders()
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) })
      if (statusFilter) params.set("status", statusFilter)
      const res = await fetch(`/api/admin/services-pro/retours?${params}`, { headers })
      if (!res.ok) throw new Error("Erreur")
      const json = await res.json()
      setData(json)
    } catch {
      toast.error("Erreur lors du chargement des retours")
    } finally {
      setLoading(false)
    }
  }, [getAuthHeaders, page, statusFilter])

  useEffect(() => { fetchData() }, [fetchData])

  const handleAction = async () => {
    if (!actionModal) return
    const headers = getAuthHeaders()
    setSaving(true)
    try {
      const body: Record<string, unknown> = { id: actionModal.item.id, status: actionModal.action }
      if (actionModal.action === "rejected") body.notes = rejectReason
      const res = await fetch("/api/admin/services-pro/retours", {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...headers },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error("Erreur")
      toast.success("Statut mis à jour avec succès")
      setActionModal(null)
      setRejectReason("")
      fetchData()
    } catch {
      toast.error("Erreur lors de la mise à jour")
    } finally {
      setSaving(false)
    }
  }

  const canApprove = (s: string) => s === "pending"
  const canRefund = (s: string) => s === "received" || s === "approved"
  const canReject = (s: string) => s === "pending"

  return (
    <div className="p-4 lg:p-8 space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin" className="p-2 rounded-xl bg-[var(--bg-card)] border border-[var(--border)] hover:border-[var(--border-hover)]/30 transition-colors">
          <ArrowLeft className="w-5 h-5 text-[var(--text-muted)]" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">Retours & Remboursements</h1>
          <p className="text-sm text-[var(--text-secondary)]">Gestion des demandes de retour</p>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        {["", "pending", "approved", "rejected", "picked_up", "received", "refunded", "cancelled"].map((s) => (
          <button
            key={s}
            onClick={() => { setPage(1); setStatusFilter(s) }}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
              statusFilter === s
                ? "bg-[var(--text-link)] text-white"
                : "bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--border-hover)]/30"
            }`}
          >
            {s ? STATUS_LABELS[s] : "Tous"}
          </button>
        ))}
      </div>

      {loading ? (
        <LoadingSpinner className="py-20" size="lg" />
      ) : !data || data.retours.length === 0 ? (
        <div className="text-center py-12 bg-[var(--bg-card)] rounded-2xl border border-[var(--border)]">
          <ShoppingBag className="w-12 h-12 text-[#1E293B] mx-auto mb-4" />
          <p className="text-[var(--text-secondary)]">Aucun retour trouvé</p>
        </div>
      ) : (
        <>
          <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] overflow-hidden">
            <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-[var(--bg-primary)] border-b border-[var(--border)] text-xs font-semibold text-[var(--text-secondary)]">
              <div className="col-span-1">ID Retour</div>
              <div className="col-span-1">Commande</div>
              <div className="col-span-2">Produit</div>
              <div className="col-span-2">Client</div>
              <div className="col-span-1">Boutique</div>
              <div className="col-span-1">Montant</div>
              <div className="col-span-1">Statut</div>
              <div className="col-span-1">Date</div>
              <div className="col-span-2">Actions</div>
            </div>
            {data.retours.map((r) => (
              <div key={r.id} className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-[var(--border)] last:border-0 items-center hover:bg-[var(--bg-primary)]/50 transition-colors">
                <div className="col-span-1 text-xs text-[var(--text-muted)] truncate">{r.id.slice(0, 8)}</div>
                <div className="col-span-1 text-xs text-[var(--text-muted)] truncate">{r.orderId.slice(0, 8)}</div>
                <div className="col-span-2 text-sm text-white font-semibold truncate">{r.productName || "-"}</div>
                <div className="col-span-2 text-xs text-[var(--text-muted)] truncate">{r.clientName || r.clientEmail}</div>
                <div className="col-span-1 text-xs text-[var(--text-muted)]">{r.shopName || "-"}</div>
                <div className="col-span-1 text-xs text-[var(--text-secondary)]">{r.refundAmount ? `${r.refundAmount.toLocaleString("fr-FR")} F` : "-"}</div>
                <div className="col-span-1">
                  <span className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold ${STATUS_COLORS[r.status]}`}>
                    {STATUS_LABELS[r.status]}
                  </span>
                </div>
                <div className="col-span-1 text-xs text-[var(--text-secondary)]">{new Date(r.createdAt).toLocaleDateString("fr-FR")}</div>
                <div className="col-span-2 flex items-center gap-1.5">
                  {canApprove(r.status) && (
                    <button onClick={() => setActionModal({ item: r, action: "approved" })}
                      className="px-2 py-1.5 rounded-xl text-[10px] font-semibold text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 transition-colors flex items-center gap-1">
                      <Check className="w-3 h-3" /> Approuver
                    </button>
                  )}
                  {canRefund(r.status) && (
                    <button onClick={() => setActionModal({ item: r, action: "refunded" })}
                      className="px-2 py-1.5 rounded-xl text-[10px] font-semibold text-green-400 bg-green-500/10 hover:bg-green-500/20 transition-colors flex items-center gap-1">
                      <RotateCcw className="w-3 h-3" /> Rembourser
                    </button>
                  )}
                  {canReject(r.status) && (
                    <button onClick={() => { setActionModal({ item: r, action: "rejected" }); setRejectReason("") }}
                      className="px-2 py-1.5 rounded-xl text-[10px] font-semibold text-red-400 bg-red-500/10 hover:bg-red-500/20 transition-colors flex items-center gap-1">
                      <Ban className="w-3 h-3" /> Rejeter
                    </button>
                  )}
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

      {actionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !saving && setActionModal(null)} />
          <div className="relative bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl w-full max-w-md shadow-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                {actionModal.action === "rejected" ? (
                  <Ban className="w-5 h-5 text-red-400" />
                ) : actionModal.action === "refunded" ? (
                  <RotateCcw className="w-5 h-5 text-green-400" />
                ) : (
                  <Check className="w-5 h-5 text-blue-400" />
                )}
                <h3 className="text-lg font-bold text-white">
                  {actionModal.action === "approved" ? "Approuver le retour" :
                   actionModal.action === "refunded" ? "Rembourser" :
                   actionModal.action === "rejected" ? "Rejeter le retour" : "Confirmer"}
                </h3>
              </div>
              <button onClick={() => !saving && setActionModal(null)} className="p-1 rounded-lg hover:bg-[var(--bg-primary)] text-[var(--text-muted)]">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-[var(--text-secondary)] mb-4">
              Passer le retour de <strong className="text-white">{actionModal.item.productName || `#${actionModal.item.id.slice(0, 8)}`}</strong> en statut <strong className="text-white">{STATUS_LABELS[actionModal.action]}</strong> ?
            </p>
            {actionModal.action === "rejected" && (
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Raison du rejet (optionnelle)"
                className="w-full rounded-2xl border border-[var(--border)] bg-[var(--bg-primary)] px-4 py-3 text-white text-sm transition-all duration-300 focus:border-[var(--border-hover)] focus:outline-none focus:ring-4 focus:ring-[#1769F2]/10 min-h-[100px] resize-none mb-6"
              />
            )}
            <div className="flex items-center justify-end gap-3">
              <button onClick={() => setActionModal(null)} disabled={saving}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--border-hover)]/30 transition-colors disabled:opacity-40">
                Annuler
              </button>
              <button onClick={handleAction} disabled={saving}
                className={`px-4 py-2 rounded-xl text-xs font-semibold text-white transition-colors disabled:opacity-40 flex items-center gap-1.5 ${
                  actionModal.action === "rejected" ? "bg-red-500 hover:bg-red-600" :
                  actionModal.action === "refunded" ? "bg-green-500 hover:bg-green-600" :
                  "bg-blue-500 hover:bg-blue-600"
                }`}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

"use client"

import { useEffect, useState, useCallback } from "react"
import toast from "react-hot-toast"
import { ArrowLeft, Loader2, Shield, Package, Search, X, AlertTriangle } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import Button from "@/components/ui/button"

interface FraudeItem {
  id: number
  productId: number
  productName: string
  productImage: string
  reason: string
  score: number
  status: string
  reportedBy: string
  createdAt: string
}

interface FraudeResponse {
  frauds: FraudeItem[]
  total: number
  page: number
  totalPages: number
}

const STATUS_LABELS: Record<string, string> = {
  pending: "En attente",
  investigating: "En cours",
  confirmed: "Confirmé",
  rejected: "Rejeté",
}

const STATUS_COLORS: Record<string, string> = {
  pending: "text-amber-400 bg-amber-500/10",
  investigating: "text-blue-400 bg-blue-500/10",
  confirmed: "text-red-400 bg-red-500/10",
  rejected: "text-green-400 bg-green-500/10",
}

export default function ClassementFraudesPage() {
  const { getAuthHeaders } = useAuth()
  const [data, setData] = useState<FraudeResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState("")
  const [actionLoading, setActionLoading] = useState<Record<number, boolean>>({})
  const [reviewModal, setReviewModal] = useState<{ fraud: FraudeItem; action: string } | null>(null)
  const [reviewNotes, setReviewNotes] = useState("")
  const limit = 50

  const fetchFraudes = useCallback(async () => {
    const headers = getAuthHeaders()
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: page.toString(), limit: limit.toString() })
      if (statusFilter) params.set("status", statusFilter)
      const res = await fetch(`/api/organic/fraud?${params}`, { headers })
      if (!res.ok) throw new Error("Erreur")
      const json = await res.json()
      setData(json)
    } catch {
      toast.error("Erreur lors du chargement des signalements")
    } finally {
      setLoading(false)
    }
  }, [getAuthHeaders, page, statusFilter])

  useEffect(() => { fetchFraudes() }, [fetchFraudes])

  const handleAction = async (fraud: FraudeItem, status: string, notes?: string) => {
    const headers = getAuthHeaders()
    setActionLoading((prev) => ({ ...prev, [fraud.id]: true }))
    try {
      const body: Record<string, unknown> = { action: "review", id: fraud.id, status }
      if (notes) body.reviewNotes = notes
      const res = await fetch("/api/organic/fraud", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...headers },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error("Erreur")
      toast.success(`Signalement ${STATUS_LABELS[status]?.toLowerCase() || status} avec succès`)
      setReviewModal(null)
      setReviewNotes("")
      fetchFraudes()
    } catch {
      toast.error("Erreur lors de la mise à jour du signalement")
    } finally {
      setActionLoading((prev) => ({ ...prev, [fraud.id]: false }))
    }
  }

  const openReviewModal = (fraud: FraudeItem, action: string) => {
    setReviewModal({ fraud, action })
    setReviewNotes("")
  }

  return (
    <div className="p-4 lg:p-8 space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin" className="p-2 rounded-xl bg-[var(--bg-card)] border border-[var(--border)] hover:border-[var(--border-hover)]/30 transition-colors">
          <ArrowLeft className="w-5 h-5 text-[var(--text-muted)]" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">Signalements de Fraude</h1>
          <p className="text-sm text-[var(--text-secondary)]">Alertes de fraude sur les produits</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
          className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[var(--border-hover)]/30 transition-colors"
        >
          <option value="">Tous les statuts</option>
          {Object.entries(STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <LoadingSpinner className="py-20" size="lg" />
      ) : !data || data.frauds.length === 0 ? (
        <div className="text-center py-12 bg-[var(--bg-card)] rounded-2xl border border-[var(--border)]">
          <Shield className="w-12 h-12 text-[#1E293B] mx-auto mb-4" />
          <p className="text-[var(--text-secondary)]">Aucun signalement trouvé</p>
        </div>
      ) : (
        <>
          <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] overflow-hidden">
            <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-[var(--bg-primary)] border-b border-[var(--border)] text-xs font-semibold text-[var(--text-secondary)]">
              <div className="col-span-2">Produit</div>
              <div className="col-span-2">Raison</div>
              <div className="col-span-1">Score</div>
              <div className="col-span-1">Statut</div>
              <div className="col-span-2">Signalé par</div>
              <div className="col-span-2">Date</div>
              <div className="col-span-2">Actions</div>
            </div>
            {data.frauds.map((f) => (
              <div key={f.id} className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-[var(--border)] last:border-0 items-center hover:bg-[var(--bg-primary)]/50 transition-colors">
                <div className="col-span-2 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[var(--bg-elevated)] overflow-hidden flex-shrink-0 flex items-center justify-center">
                    {f.productImage ? (
                      <img src={f.productImage} alt={f.productName} className="w-full h-full object-contain" />
                    ) : (
                      <Package className="w-5 h-5 text-[var(--text-muted)]" />
                    )}
                  </div>
                  <span className="text-sm font-semibold text-white truncate">{f.productName}</span>
                </div>
                <div className="col-span-2 text-xs text-[var(--text-muted)]">{f.reason}</div>
                <div className="col-span-1 text-sm font-bold text-[var(--text-link)]">{f.score?.toFixed(1)}</div>
                <div className="col-span-1">
                  <span className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold ${STATUS_COLORS[f.status] || "text-[var(--text-secondary)] bg-[var(--bg-elevated)]"}`}>
                    {STATUS_LABELS[f.status] || f.status}
                  </span>
                </div>
                <div className="col-span-2 text-xs text-[var(--text-muted)]">{f.reportedBy || "-"}</div>
                <div className="col-span-2 text-xs text-[var(--text-secondary)]">{new Date(f.createdAt).toLocaleString("fr-FR")}</div>
                <div className="col-span-2 flex items-center gap-1.5">
                  {f.status === "pending" && (
                    <>
                      <button
                        onClick={() => openReviewModal(f, "investigating")}
                        disabled={actionLoading[f.id]}
                        className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 transition-colors disabled:opacity-40"
                      >
                        {actionLoading[f.id] ? <Loader2 className="w-3 h-3 animate-spin" /> : <Search className="w-3 h-3" />}
                        Investiguer
                      </button>
                      <button
                        onClick={() => openReviewModal(f, "confirmed")}
                        disabled={actionLoading[f.id]}
                        className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold text-red-400 bg-red-500/10 hover:bg-red-500/20 transition-colors disabled:opacity-40"
                      >
                        <AlertTriangle className="w-3 h-3" />
                        Confirmer
                      </button>
                      <button
                        onClick={() => openReviewModal(f, "rejected")}
                        disabled={actionLoading[f.id]}
                        className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold text-green-400 bg-green-500/10 hover:bg-green-500/20 transition-colors disabled:opacity-40"
                      >
                        <X className="w-3 h-3" />
                        Rejeter
                      </button>
                    </>
                  )}
                  {f.status === "investigating" && (
                    <>
                      <button
                        onClick={() => openReviewModal(f, "confirmed")}
                        disabled={actionLoading[f.id]}
                        className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold text-red-400 bg-red-500/10 hover:bg-red-500/20 transition-colors disabled:opacity-40"
                      >
                        <AlertTriangle className="w-3 h-3" />
                        Confirmer
                      </button>
                      <button
                        onClick={() => openReviewModal(f, "rejected")}
                        disabled={actionLoading[f.id]}
                        className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold text-green-400 bg-green-500/10 hover:bg-green-500/20 transition-colors disabled:opacity-40"
                      >
                        <X className="w-3 h-3" />
                        Rejeter
                      </button>
                    </>
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

      {reviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setReviewModal(null)} />
          <div className="relative bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl w-full max-w-md shadow-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-amber-400" />
                <h3 className="text-lg font-bold text-white">
                  {reviewModal.action === "confirmed" ? "Confirmer la fraude" : reviewModal.action === "rejected" ? "Rejeter le signalement" : "Investiguer le signalement"}
                </h3>
              </div>
              <button onClick={() => setReviewModal(null)} className="p-1 rounded-lg hover:bg-[var(--bg-primary)] text-[var(--text-muted)]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm text-[var(--text-secondary)] mb-4">
              {reviewModal.action === "confirmed"
                ? `Confirmer la fraude pour "${reviewModal.fraud.productName}"`
                : reviewModal.action === "rejected"
                  ? `Rejeter le signalement pour "${reviewModal.fraud.productName}"`
                  : `Marquer "${reviewModal.fraud.productName}" comme en cours d'investigation`}
            </p>

            <div className="mb-4">
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">Notes de révision</label>
              <textarea
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder="Ajouter des notes..."
                rows={4}
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-primary)] px-4 py-3 text-white placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--border-hover)]/30 transition-colors resize-none text-sm"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-6 border-t border-[var(--border)]">
              <Button variant="outline" size="sm" onClick={() => setReviewModal(null)}>
                Annuler
              </Button>
              <Button
                size="sm"
                onClick={() => handleAction(reviewModal.fraud, reviewModal.action, reviewNotes)}
                disabled={actionLoading[reviewModal.fraud.id]}
                className={reviewModal.action === "confirmed" ? "bg-red-500 hover:bg-red-600 text-white" : reviewModal.action === "rejected" ? "bg-green-500 hover:bg-green-600 text-white" : ""}
              >
                {actionLoading[reviewModal.fraud.id] ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {reviewModal.action === "confirmed" ? "Confirmer" : reviewModal.action === "rejected" ? "Rejeter" : "Investiguer"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

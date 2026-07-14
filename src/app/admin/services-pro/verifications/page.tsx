"use client"

import { useEffect, useState, useCallback } from "react"
import toast from "react-hot-toast"
import { ArrowLeft, Loader2, Store, Shield, X, Check, Ban } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { LoadingSpinner } from "@/components/ui/loading-spinner"

interface VerificationItem {
  id: string
  shopId: string
  shopName: string
  sellerName: string
  sellerEmail: string
  verificationType: "individual" | "business"
  status: "pending" | "approved" | "rejected" | "expired"
  documents: string | null
  createdAt: string
  reviewedAt: string | null
}

interface VerificationsResponse {
  verifications: VerificationItem[]
  total: number
  page: number
  totalPages: number
}

const STATUS_LABELS: Record<string, string> = {
  pending: "En attente",
  approved: "Approuvé",
  rejected: "Rejeté",
  expired: "Expiré",
}

const STATUS_COLORS: Record<string, string> = {
  pending: "text-amber-400 bg-amber-500/10",
  approved: "text-green-400 bg-green-500/10",
  rejected: "text-red-400 bg-red-500/10",
  expired: "text-[var(--text-secondary)] bg-[var(--bg-primary)]",
}

export default function AdminVerificationsPage() {
  const { getAuthHeaders } = useAuth()
  const [data, setData] = useState<VerificationsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState("")
  const limit = 50

  const [approveModal, setApproveModal] = useState<VerificationItem | null>(null)
  const [rejectModal, setRejectModal] = useState<VerificationItem | null>(null)
  const [rejectionReason, setRejectionReason] = useState("")
  const [saving, setSaving] = useState(false)

  const fetchData = useCallback(async () => {
    const headers = getAuthHeaders()
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) })
      if (statusFilter) params.set("status", statusFilter)
      const res = await fetch(`/api/admin/services-pro/verifications?${params}`, { headers })
      if (!res.ok) throw new Error("Erreur")
      const json = await res.json()
      setData(json)
    } catch {
      toast.error("Erreur lors du chargement des vérifications")
    } finally {
      setLoading(false)
    }
  }, [getAuthHeaders, page, statusFilter])

  useEffect(() => { fetchData() }, [fetchData])

  const handleAction = async (id: string, status: string) => {
    const headers = getAuthHeaders()
    setSaving(true)
    try {
      const res = await fetch("/api/admin/services-pro/verifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...headers },
        body: JSON.stringify({ id, status, rejectionReason: status === "rejected" ? rejectionReason : undefined }),
      })
      if (!res.ok) throw new Error("Erreur")
      toast.success(status === "approved" ? "Vérification approuvée" : "Vérification rejetée")
      setApproveModal(null)
      setRejectModal(null)
      setRejectionReason("")
      fetchData()
    } catch {
      toast.error("Erreur lors de la mise à jour")
    } finally {
      setSaving(false)
    }
  }

  const getDocumentCount = (docs: string | null) => {
    if (!docs) return 0
    try { return JSON.parse(docs).length } catch { return 0 }
  }

  return (
    <div className="p-4 lg:p-8 space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin" className="p-2 rounded-xl bg-[var(--bg-card)] border border-[var(--border)] hover:border-[var(--border-hover)]/30 transition-colors">
          <ArrowLeft className="w-5 h-5 text-[var(--text-muted)]" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">Vérifications Vendeurs</h1>
          <p className="text-sm text-[var(--text-secondary)]">Demandes de vérification professionnelle</p>
        </div>
      </div>

      <div className="flex gap-2">
        {["", "pending", "approved", "rejected", "expired"].map((s) => (
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
      ) : !data || data.verifications.length === 0 ? (
        <div className="text-center py-12 bg-[var(--bg-card)] rounded-2xl border border-[var(--border)]">
          <Shield className="w-12 h-12 text-[#1E293B] mx-auto mb-4" />
          <p className="text-[var(--text-secondary)]">Aucune vérification trouvée</p>
        </div>
      ) : (
        <>
          <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] overflow-x-auto">
            <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-[var(--bg-primary)] border-b border-[var(--border)] text-xs font-semibold text-[var(--text-secondary)] sticky top-0 z-10">
              <div className="col-span-2">Boutique</div>
              <div className="col-span-2">Vendeur</div>
              <div className="col-span-1">Email</div>
              <div className="col-span-1">Type</div>
              <div className="col-span-1">Statut</div>
              <div className="col-span-1">Documents</div>
              <div className="col-span-2">Date</div>
              <div className="col-span-2">Actions</div>
            </div>
            {data.verifications.map((v) => (
              <div key={v.id} className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-[var(--border)] last:border-0 items-center hover:bg-[var(--bg-primary)]/50 transition-colors">
                <div className="col-span-2 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#059669]/15 flex items-center justify-center">
                    <Store className="w-4 h-4 text-[var(--text-success)]" />
                  </div>
                  <span className="text-sm font-semibold text-white">{v.shopName || "-"}</span>
                </div>
                <div className="col-span-2 text-sm text-white font-semibold">{v.sellerName}</div>
                <div className="col-span-1 text-xs text-[var(--text-muted)] truncate">{v.sellerEmail}</div>
                <div className="col-span-1 text-xs text-[var(--text-secondary)]">{v.verificationType === "business" ? "Professionnel" : "Particulier"}</div>
                <div className="col-span-1">
                  <span className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold ${STATUS_COLORS[v.status]}`}>
                    {STATUS_LABELS[v.status]}
                  </span>
                </div>
                <div className="col-span-1 text-xs text-[var(--text-secondary)]">{getDocumentCount(v.documents)}</div>
                <div className="col-span-2 text-xs text-[var(--text-secondary)]">{new Date(v.createdAt).toLocaleDateString("fr-FR")}</div>
                <div className="col-span-2 flex items-center gap-2">
                  {v.status === "pending" && (
                    <>
                      <button
                        onClick={() => setApproveModal(v)}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-green-400 bg-green-500/10 hover:bg-green-500/20 transition-colors"
                      >
                        <Check className="w-3 h-3" /> Approuver
                      </button>
                      <button
                        onClick={() => { setRejectModal(v); setRejectionReason("") }}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-red-400 bg-red-500/10 hover:bg-red-500/20 transition-colors"
                      >
                        <Ban className="w-3 h-3" /> Rejeter
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

      {approveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !saving && setApproveModal(null)} />
          <div className="relative bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl w-full max-w-sm shadow-2xl p-6 text-center">
            <div className="w-12 h-12 rounded-xl bg-green-500/15 flex items-center justify-center mx-auto mb-4">
              <Check className="w-6 h-6 text-green-400" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Approuver la vérification</h3>
            <p className="text-sm text-[var(--text-secondary)] mb-6">
              Confirmer l'approbation de la vérification pour <strong className="text-white">{approveModal.shopName}</strong> ?
            </p>
            <div className="flex items-center justify-center gap-3">
              <button onClick={() => setApproveModal(null)} disabled={saving}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--border-hover)]/30 transition-colors disabled:opacity-40">
                Annuler
              </button>
              <button onClick={() => handleAction(approveModal.id, "approved")} disabled={saving}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-green-500 hover:bg-green-600 text-white transition-colors disabled:opacity-40 flex items-center gap-1.5">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}

      {rejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !saving && setRejectModal(null)} />
          <div className="relative bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl w-full max-w-md shadow-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Ban className="w-5 h-5 text-red-400" />
                <h3 className="text-lg font-bold text-white">Rejeter la vérification</h3>
              </div>
              <button onClick={() => !saving && setRejectModal(null)} className="p-1 rounded-lg hover:bg-[var(--bg-primary)] text-[var(--text-muted)]">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-[var(--text-secondary)] mb-4">
              Rejeter la vérification de <strong className="text-white">{rejectModal.shopName}</strong>
            </p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Raison du rejet (optionnelle)"
              className="w-full rounded-2xl border border-[var(--border)] bg-[var(--bg-primary)] px-4 py-3 text-white text-sm transition-all duration-300 focus:border-[var(--border-hover)] focus:outline-none focus:ring-4 focus:ring-[#1769F2]/10 min-h-[100px] resize-none mb-6"
            />
            <div className="flex items-center justify-end gap-3">
              <button onClick={() => setRejectModal(null)} disabled={saving}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--border-hover)]/30 transition-colors disabled:opacity-40">
                Annuler
              </button>
              <button onClick={() => handleAction(rejectModal.id, "rejected")} disabled={saving}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-red-500 hover:bg-red-600 text-white transition-colors disabled:opacity-40 flex items-center gap-1.5">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Ban className="w-4 h-4" />}
                Rejeter
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

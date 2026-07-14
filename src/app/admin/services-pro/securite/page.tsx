"use client"

import { useEffect, useState, useCallback } from "react"
import toast from "react-hot-toast"
import { ArrowLeft, Loader2, Shield, LogIn, Activity, Store, Check, X } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { LoadingSpinner } from "@/components/ui/loading-spinner"

interface LoginLog {
  id: number
  userId: number
  userName: string
  userEmail: string
  ip: string
  userAgent: string
  device: string | null
  country: string | null
  city: string | null
  success: number
  failReason: string | null
  createdAt: string
}

interface ActionLog {
  id: number
  userId: number
  userName: string
  shopId: string | null
  shopName: string | null
  action: string
  entityType: string | null
  entityId: string | null
  ip: string | null
  createdAt: string
}

interface LogsResponse {
  logs: (LoginLog | ActionLog)[]
  total: number
  page: number
  totalPages: number
}

export default function AdminSecuritePage() {
  const { getAuthHeaders } = useAuth()
  const [data, setData] = useState<LogsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [tab, setTab] = useState<"login" | "action">("login")
  const limit = 50

  const fetchData = useCallback(async () => {
    const headers = getAuthHeaders()
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/services-pro/logs?page=${page}&limit=${limit}&type=${tab}`, { headers })
      if (!res.ok) throw new Error("Erreur")
      const json = await res.json()
      setData(json)
    } catch {
      toast.error("Erreur lors du chargement des logs")
    } finally {
      setLoading(false)
    }
  }, [getAuthHeaders, page, tab])

  useEffect(() => { fetchData() }, [fetchData])

  return (
    <div className="p-4 lg:p-8 space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin" className="p-2 rounded-xl bg-[var(--bg-card)] border border-[var(--border)] hover:border-[var(--border-hover)]/30 transition-colors">
          <ArrowLeft className="w-5 h-5 text-[var(--text-muted)]" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">Sécurité</h1>
          <p className="text-sm text-[var(--text-secondary)]">Logs de connexion et d'activité</p>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => { setTab("login"); setPage(1) }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${
            tab === "login"
              ? "bg-[var(--text-link)] text-white"
              : "bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--border-hover)]/30"
          }`}
        >
          <LogIn className="w-4 h-4" /> Connexions
        </button>
        <button
          onClick={() => { setTab("action"); setPage(1) }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${
            tab === "action"
              ? "bg-[var(--text-link)] text-white"
              : "bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--border-hover)]/30"
          }`}
        >
          <Activity className="w-4 h-4" /> Actions
        </button>
      </div>

      {loading ? (
        <LoadingSpinner className="py-20" size="lg" />
      ) : !data || data.logs.length === 0 ? (
        <div className="text-center py-12 bg-[var(--bg-card)] rounded-2xl border border-[var(--border)]">
          <Shield className="w-12 h-12 text-[#1E293B] mx-auto mb-4" />
          <p className="text-[var(--text-secondary)]">Aucun log trouvé</p>
        </div>
      ) : (
        <>
          <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] overflow-x-auto">
            {tab === "login" ? (
              <>
                <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-[var(--bg-primary)] border-b border-[var(--border)] text-xs font-semibold text-[var(--text-secondary)] sticky top-0 z-10">
                  <div className="col-span-2">Utilisateur</div>
                  <div className="col-span-2">Email</div>
                  <div className="col-span-2">IP</div>
                  <div className="col-span-2">Appareil</div>
                  <div className="col-span-1">Pays</div>
                  <div className="col-span-1">Succès</div>
                  <div className="col-span-2">Date</div>
                </div>
                {(data.logs as LoginLog[]).map((l) => (
                  <div key={l.id} className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-[var(--border)] last:border-0 items-center hover:bg-[var(--bg-primary)]/50 transition-colors">
                    <div className="col-span-2 text-sm text-white font-semibold">{l.userName || "-"}</div>
                    <div className="col-span-2 text-xs text-[var(--text-muted)]">{l.userEmail || "-"}</div>
                    <div className="col-span-2 text-xs text-[var(--text-muted)] font-mono">{l.ip}</div>
                    <div className="col-span-2 text-xs text-[var(--text-secondary)] truncate">{l.device || l.userAgent?.slice(0, 30) || "-"}</div>
                    <div className="col-span-1 text-xs text-[var(--text-secondary)]">{l.country || "-"}</div>
                    <div className="col-span-1">
                      {l.success ? (
                        <Check className="w-4 h-4 text-green-400" />
                      ) : (
                        <X className="w-4 h-4 text-red-400" />
                      )}
                    </div>
                    <div className="col-span-2 text-xs text-[var(--text-secondary)]">{new Date(l.createdAt).toLocaleString("fr-FR")}</div>
                  </div>
                ))}
              </>
            ) : (
              <>
                <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-[var(--bg-primary)] border-b border-[var(--border)] text-xs font-semibold text-[var(--text-secondary)] sticky top-0 z-10">
                  <div className="col-span-2">Utilisateur</div>
                  <div className="col-span-2">Boutique</div>
                  <div className="col-span-2">Action</div>
                  <div className="col-span-1">Type Entité</div>
                  <div className="col-span-1">ID Entité</div>
                  <div className="col-span-2">IP</div>
                  <div className="col-span-2">Date</div>
                </div>
                {(data.logs as ActionLog[]).map((l) => (
                  <div key={l.id} className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-[var(--border)] last:border-0 items-center hover:bg-[var(--bg-primary)]/50 transition-colors">
                    <div className="col-span-2 text-sm text-white font-semibold">{l.userName || "-"}</div>
                    <div className="col-span-2 text-xs text-[var(--text-muted)]">{l.shopName || "-"}</div>
                    <div className="col-span-2 text-xs text-[var(--text-secondary)]">{l.action}</div>
                    <div className="col-span-1 text-xs text-[var(--text-muted)]">{l.entityType || "-"}</div>
                    <div className="col-span-1 text-xs text-[var(--text-muted)] truncate">{l.entityId?.slice(0, 8) || "-"}</div>
                    <div className="col-span-2 text-xs text-[var(--text-muted)] font-mono">{l.ip || "-"}</div>
                    <div className="col-span-2 text-xs text-[var(--text-secondary)]">{new Date(l.createdAt).toLocaleString("fr-FR")}</div>
                  </div>
                ))}
              </>
            )}
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

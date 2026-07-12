"use client"

import { useEffect, useState } from "react"
import { CreditCard, CheckCircle, XCircle, ArrowLeft } from "lucide-react"
import Link from "next/link"

interface CreditApplication {
  id: string
  name: string
  email: string
  amount: number
  reason: string
  status: "pending" | "approved" | "rejected"
  date: string
}

export default function AdminCreditsPage() {
  const [applications, setApplications] = useState<CreditApplication[]>([])

  useEffect(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem("creditApplications") : null
    setApplications(stored ? JSON.parse(stored) : [])
  }, [])

  const statusConfig: Record<string, { icon: typeof CheckCircle; color: string; label: string }> = {
    pending: { icon: CreditCard, color: "text-amber-500 bg-amber-500/10", label: "En attente" },
    approved: { icon: CheckCircle, color: "text-green-500 bg-green-500/10", label: "Approuvé" },
    rejected: { icon: XCircle, color: "text-red-500 bg-red-500/10", label: "Rejeté" },
  }

  return (
    <div className="p-4 lg:p-8 space-y-8">
      <div className="flex items-center gap-4">
        <Link href="/admin" className="p-2 rounded-xl bg-[var(--bg-card)] border border-[var(--border)] hover:border-[var(--border-hover)]/30 transition-colors">
          <ArrowLeft className="w-5 h-5 text-[var(--text-muted)]" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">Crédits</h1>
          <p className="text-[var(--text-secondary)] text-sm">{applications.length} demandes</p>
        </div>
      </div>

      {applications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-[var(--bg-card)] rounded-2xl border border-[var(--border)]">
          <CreditCard className="w-12 h-12 text-[#1E293B] mx-auto mb-4" />
          <p className="text-[var(--text-secondary)]">Aucune demande de crédit</p>
        </div>
      ) : (
        <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] overflow-hidden">
          <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-[var(--bg-primary)] border-b border-[var(--border)] text-xs font-semibold text-[var(--text-secondary)]">
            <div className="col-span-2">Nom</div>
            <div className="col-span-3">Email</div>
            <div className="col-span-2">Montant</div>
            <div className="col-span-3">Motif</div>
            <div className="col-span-2">Statut</div>
          </div>
          {applications.map((app) => {
            const cfg = statusConfig[app.status] || statusConfig.pending
            const StatusIcon = cfg.icon
            return (
              <div key={app.id} className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-[var(--border)] last:border-0 items-center hover:bg-[var(--bg-primary)]/50 transition-colors">
                <div className="col-span-2 text-sm font-semibold text-white">{app.name}</div>
                <div className="col-span-3 text-sm text-[var(--text-muted)]">{app.email}</div>
                <div className="col-span-2 text-sm font-bold text-white">{app.amount.toLocaleString("fr-FR")} F</div>
                <div className="col-span-3 text-xs text-[var(--text-secondary)] truncate">{app.reason}</div>
                <div className="col-span-2">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${cfg.color}`}>
                    <StatusIcon className="w-3 h-3" /> {cfg.label}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

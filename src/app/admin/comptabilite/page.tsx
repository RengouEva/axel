"use client"

import { BookOpen } from "lucide-react"

export default function AdminComptabilitePage() {
  return (
    <div className="p-4 lg:p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Comptabilité</h1>
        <p className="text-[var(--text-secondary)] text-sm">Gestion comptable</p>
      </div>

      <div className="flex flex-col items-center justify-center py-20 bg-[var(--bg-card)] rounded-2xl border border-[var(--border)]">
        <div className="w-20 h-20 rounded-2xl bg-[var(--text-link)]/10 flex items-center justify-center mb-6">
          <BookOpen className="w-10 h-10 text-[var(--text-link)]" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Module comptabilité en cours de développement</h2>
        <p className="text-[var(--text-secondary)] text-sm max-w-md text-center">
          Le module de comptabilité avec export des bilans, factures et rapports financiers
          sera bientôt disponible.
        </p>
        <div className="flex items-center gap-2 mt-6 px-4 py-2 rounded-xl bg-[var(--text-link)]/5 border border-[var(--border-hover)]/20">
          <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
          <span className="text-xs text-[var(--text-muted)]">En développement</span>
        </div>
      </div>
    </div>
  )
}

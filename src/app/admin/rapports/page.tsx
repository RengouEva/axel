"use client"

import { BarChart3, FileDown, Calendar } from "lucide-react"

export default function AdminRapportsPage() {
  return (
    <div className="p-4 lg:p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Rapports</h1>
        <p className="text-[var(--text-secondary)] text-sm">Analyses et export de données</p>
      </div>

      <div className="flex flex-col items-center justify-center py-20 bg-[var(--bg-card)] rounded-2xl border border-[var(--border)]">
        <div className="w-20 h-20 rounded-2xl bg-[var(--text-link)]/10 flex items-center justify-center mb-6">
          <BarChart3 className="w-10 h-10 text-[var(--text-link)]" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Rapports disponibles prochainement</h2>
        <p className="text-[var(--text-secondary)] text-sm max-w-md text-center mb-8">
          Les rapports détaillés sur les ventes, les utilisateurs et les performances
          de la plateforme seront bientôt accessibles.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full max-w-lg">
          {[
            { icon: Calendar, label: "Rapport mensuel", desc: "Ventes et revenus" },
            { icon: BarChart3, label: "Rapport analytique", desc: "Performance" },
            { icon: FileDown, label: "Export CSV", desc: "Données brutes" },
          ].map((item) => {
            const Icon = item.icon
            return (
              <div key={item.label} className="p-4 rounded-xl bg-[var(--bg-primary)] border border-[var(--border)] opacity-50">
                <Icon className="w-5 h-5 text-[var(--text-secondary)] mb-2" />
                <p className="text-xs font-semibold text-[var(--text-muted)]">{item.label}</p>
                <p className="text-[10px] text-[var(--text-secondary)]">{item.desc}</p>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

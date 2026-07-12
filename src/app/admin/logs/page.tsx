"use client"

import { useEffect, useState } from "react"
import { Activity, Shield, AlertTriangle, Info, XCircle } from "lucide-react"

interface LogEntry {
  id: number
  action: string
  user: string
  date: string
  status: "success" | "warning" | "error" | "info"
  details: string
}

const mockLogs: LogEntry[] = [
  { id: 1, action: "Connexion admin", user: "admin@axel.com", date: "2025-07-10 14:32", status: "success", details: "Connexion depuis IP 192.168.1.1" },
  { id: 2, action: "Modération produit", user: "admin@axel.com", date: "2025-07-10 13:15", status: "info", details: "Approbation produit #1423" },
  { id: 3, action: "Tentative connexion", user: "unknown@test.com", date: "2025-07-10 12:45", status: "error", details: "Échec d'authentification" },
  { id: 4, action: "Paiement refusé", user: "client@example.com", date: "2025-07-10 11:30", status: "warning", details: "Fonds insuffisants" },
  { id: 5, action: "Création boutique", user: "seller@example.com", date: "2025-07-09 16:00", status: "success", details: "Boutique 'TechStore' créée" },
  { id: 6, action: "Mise à jour CMS", user: "admin@axel.com", date: "2025-07-09 14:20", status: "info", details: "Page CGV modifiée" },
  { id: 7, action: "Suppression utilisateur", user: "admin@axel.com", date: "2025-07-08 10:00", status: "warning", details: "Compte #89 supprimé" },
]

const statusConfig: Record<string, { icon: typeof Activity; color: string }> = {
  success: { icon: Activity, color: "text-green-500" },
  warning: { icon: AlertTriangle, color: "text-amber-500" },
  error: { icon: XCircle, color: "text-red-500" },
  info: { icon: Info, color: "text-[var(--text-link)]" },
}

export default function AdminLogsPage() {
  const [logs] = useState<LogEntry[]>(mockLogs)

  return (
    <div className="p-4 lg:p-8 space-y-8">
      <div className="flex items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Logs</h1>
          <p className="text-[var(--text-secondary)] text-sm">Activité système | {logs.length} entrées</p>
        </div>
      </div>

      <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] overflow-hidden">
        <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-[var(--bg-primary)] border-b border-[var(--border)] text-xs font-semibold text-[var(--text-secondary)]">
          <div className="col-span-1" />
          <div className="col-span-3">Action</div>
          <div className="col-span-2">Utilisateur</div>
          <div className="col-span-4">Détails</div>
          <div className="col-span-2">Date</div>
        </div>
        {logs.map((log) => {
          const cfg = statusConfig[log.status] || statusConfig.info
          const StatusIcon = cfg.icon
          return (
            <div key={log.id} className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-[var(--border)] last:border-0 items-center hover:bg-[var(--bg-primary)]/50 transition-colors">
              <div className="col-span-1">
                <StatusIcon className={`w-4 h-4 ${cfg.color}`} />
              </div>
              <div className="col-span-3 text-sm font-semibold text-white">{log.action}</div>
              <div className="col-span-2 text-xs text-[var(--text-muted)]">{log.user}</div>
              <div className="col-span-4 text-xs text-[var(--text-secondary)] truncate">{log.details}</div>
              <div className="col-span-2 text-xs text-[var(--text-secondary)]">{log.date}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

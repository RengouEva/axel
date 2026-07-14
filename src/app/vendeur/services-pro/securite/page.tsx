"use client"

import { useState, useEffect, useCallback } from "react"
import { Lock, Smartphone, Users, History, Shield, Save, AlertTriangle } from "lucide-react"
import Button from "@/components/ui/button"
import toast from "react-hot-toast"
import { useAuth } from "@/lib/auth-context"

export default function SecurityPage() {
  const { getAuthHeaders } = useAuth()
  const [tab, setTab] = useState("settings")
  const [security, setSecurity] = useState<any>(null)
  const [team, setTeam] = useState<any[]>([])
  const [actionLogs, setActionLogs] = useState<any[]>([])
  const [loginLogs, setLoginLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false)
  const [sessionTimeout, setSessionTimeout] = useState("60")
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteRole, setInviteRole] = useState("editor")

  const loadAll = useCallback(async () => {
    setLoading(true)
    try {
      const [sec, tm, logs, logins] = await Promise.all([
        fetch("/api/vendeur/services-pro/security", { headers: getAuthHeaders() }).then(r => r.json()),
        fetch("/api/vendeur/services-pro/security/team", { headers: getAuthHeaders() }).then(r => r.json()),
        fetch("/api/vendeur/services-pro/security/logs?type=actions", { headers: getAuthHeaders() }).then(r => r.json()),
        fetch("/api/vendeur/services-pro/security/logs?type=logins", { headers: getAuthHeaders() }).then(r => r.json()),
      ])
      setSecurity(sec.security || {})
      setTwoFactorEnabled(sec.security?.twoFactorEnabled || false)
      setSessionTimeout(String(sec.security?.sessionTimeout || 60))
      setTeam(tm.members || [])
      setActionLogs(logs.logs || [])
      setLoginLogs(logins.logs || [])
    } catch {
      toast.error("Erreur lors du chargement")
    } finally {
      setLoading(false)
    }
  }, [getAuthHeaders])

  useEffect(() => { loadAll() }, [loadAll])

  const securityScore = (() => {
    let score = 0
    if (twoFactorEnabled) score += 40
    score += Math.min(team.length * 10, 30)
    return Math.max(0, Math.min(100, score))
  })()

  const scoreColor = securityScore >= 70 ? "text-green-400" : securityScore >= 40 ? "text-orange-400" : "text-red-400"
  const scoreBg = securityScore >= 70 ? "bg-green-500/10 border-green-500/20" : securityScore >= 40 ? "bg-orange-500/10 border-orange-500/20" : "bg-red-500/10 border-red-500/20"

  const saveSecurity = async () => {
    const res = await fetch("/api/vendeur/services-pro/security", {
      method: "PUT", headers: { "Content-Type": "application/json", ...getAuthHeaders() },
      body: JSON.stringify({ twoFactorEnabled, sessionTimeout: parseInt(sessionTimeout) }),
    })
    const data = await res.json()
    if (!res.ok) { toast.error(data.error); return }
    if (data.backupCodes) {
      toast.success("Codes de récupération générés")
    }
    toast.success("Paramètres de sécurité mis à jour")
  }

  const inviteMember = async () => {
    const res = await fetch("/api/vendeur/services-pro/security/team", {
      method: "POST", headers: { "Content-Type": "application/json", ...getAuthHeaders() },
      body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
    })
    const data = await res.json()
    if (!res.ok) { toast.error(data.error); return }
    toast.success("Membre invité")
    setInviteEmail("")
    loadAll()
  }

  const removeMember = async (id: number) => {
    const res = await fetch(`/api/vendeur/services-pro/security/team?id=${id}`, { method: "DELETE", headers: getAuthHeaders() })
    if (!res.ok) { try { const d = await res.json(); toast.error(d.error || "Erreur") } catch { toast.error("Erreur") } return }
    toast.success("Membre retiré")
    loadAll()
  }

  const tabs = [
    { id: "settings", label: "Sécurité", icon: Lock },
    { id: "team", label: "Équipe", icon: Users },
    { id: "logs", label: "Journal", icon: History },
  ]

  if (loading) return <div className="w-full min-h-screen bg-[var(--bg-secondary)] flex items-center justify-center"><p className="text-[var(--text-secondary)]">Chargement...</p></div>

  return (
    <div className="w-full min-h-screen bg-[var(--bg-secondary)] p-6">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Lock className="w-8 h-8 text-[var(--text-link)]" />
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">Sécurité</h1>
            <p className="text-sm text-[var(--text-secondary)]">Protection avancée de votre compte et équipe</p>
          </div>
        </div>

        <div className={`p-5 rounded-2xl border-2 ${scoreBg} mb-6 flex items-center justify-between`}>
          <div className="flex items-center gap-3">
            <Shield className={`w-8 h-8 ${scoreColor}`} />
            <div>
              <p className="font-bold text-[var(--text-primary)]">Score de sécurité</p>
              <p className="text-xs text-[var(--text-secondary)]">Basé sur 2FA et taille de l'équipe</p>
            </div>
          </div>
          <div className={`w-16 h-16 rounded-full border-4 flex items-center justify-center font-bold text-lg ${scoreColor}`} style={{ borderColor: securityScore >= 70 ? "#10B981" : securityScore >= 40 ? "#F97316" : "#EF4444" }}>
            {securityScore}
          </div>
        </div>

        <div className="flex gap-2 mb-6">
          {tabs.map(t => {
            const Icon = t.icon
            return (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium ${tab === t.id ? "bg-[var(--text-link)] text-white" : "bg-[var(--bg-primary)] text-[var(--text-secondary)] border border-[var(--border)]"}`}>
                <Icon className="w-4 h-4" /> {t.label}
              </button>
            )
          })}
        </div>

        {tab === "settings" && (
          <div className="bg-[var(--bg-primary)] rounded-2xl border-2 border-[var(--border)] p-6 space-y-6">
            <div>
              <h2 className="font-bold text-[var(--text-primary)] mb-4">Authentification forte (2FA)</h2>
              <div className="flex items-center justify-between p-4 rounded-xl bg-[var(--bg-secondary)]">
                <div className="flex items-center gap-3">
                  <Smartphone className="w-5 h-5 text-[var(--text-link)]" />
                  <div>
                    <p className="text-sm font-medium text-[var(--text-primary)]">Authentification à deux facteurs</p>
                    <p className="text-xs text-[var(--text-secondary)]">Sécurisez votre compte avec une couche de protection supplémentaire</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" checked={twoFactorEnabled} onChange={e => setTwoFactorEnabled(e.target.checked)} className="sr-only peer" />
                  <div className="w-11 h-6 bg-gray-600 rounded-full peer peer-checked:bg-[var(--text-link)] after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
                </label>
              </div>
            </div>

            <div>
              <h2 className="font-bold text-[var(--text-primary)] mb-4">Session</h2>
              <div className="p-4 rounded-xl bg-[var(--bg-secondary)]">
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">Délai d'expiration de session (minutes)</label>
                <input value={sessionTimeout} onChange={e => setSessionTimeout(e.target.value)} type="number" min="5" max="480"
                  className="w-full rounded-xl border-2 border-[var(--border)] bg-[var(--bg-primary)] px-4 py-2 text-sm text-[var(--text-primary)]" />
              </div>
            </div>

            <Button onClick={saveSecurity}><Save className="w-4 h-4" /> Enregistrer</Button>
          </div>
        )}

        {tab === "team" && (
          <div className="space-y-6">
            <div className="bg-[var(--bg-primary)] rounded-2xl border-2 border-[var(--border)] p-6">
              <h2 className="font-bold text-[var(--text-primary)] mb-4">Inviter un membre</h2>
              <div className="flex gap-3">
                <input value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="Email du membre" className="flex-1 rounded-xl border-2 border-[var(--border)] bg-[var(--bg-secondary)] px-4 py-2 text-sm text-[var(--text-primary)]" />
                <select value={inviteRole} onChange={e => setInviteRole(e.target.value)} className="rounded-xl border-2 border-[var(--border)] bg-[var(--bg-secondary)] px-4 py-2 text-sm text-[var(--text-primary)]">
                  <option value="editor">Éditeur</option>
                  <option value="manager">Gestionnaire</option>
                  <option value="support">Support</option>
                  <option value="analyst">Analyste</option>
                </select>
                <Button onClick={inviteMember} size="sm"><Shield className="w-4 h-4" /> Inviter</Button>
              </div>
            </div>

            <div className="bg-[var(--bg-primary)] rounded-2xl border-2 border-[var(--border)] p-6">
              <h2 className="font-bold text-[var(--text-primary)] mb-4">Membres de l'équipe</h2>
              <div className="space-y-3">
                {team.map((m: any) => (
                  <div key={m.id} className="flex items-center justify-between p-3 rounded-xl bg-[var(--bg-secondary)]">
                    <div>
                      <p className="font-semibold text-sm text-[var(--text-primary)]">{m.userName}</p>
                      <p className="text-xs text-[var(--text-secondary)]">{m.userEmail} • {m.role} • {m.status}</p>
                    </div>
                    <button onClick={() => removeMember(m.id)} className="text-red-400 hover:text-red-300 text-xs">Retirer</button>
                  </div>
                ))}
                {team.length === 0 && <p className="text-sm text-[var(--text-secondary)] text-center py-4">Aucun membre</p>}
              </div>
            </div>
          </div>
        )}

        {tab === "logs" && (
          <div className="space-y-6">
            <div className="bg-[var(--bg-primary)] rounded-2xl border-2 border-[var(--border)] p-6">
              <h2 className="font-bold text-[var(--text-primary)] mb-4">Journal des actions</h2>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {actionLogs.map((log: any) => (
                  <div key={log.id} className="flex items-center justify-between p-2 rounded-lg bg-[var(--bg-secondary)] text-xs">
                    <span className="text-[var(--text-primary)]">{log.action}</span>
                    <span className="text-[var(--text-secondary)]">{log.userName} • {new Date(log.createdAt).toLocaleString("fr-FR")}</span>
                  </div>
                ))}
                {actionLogs.length === 0 && <p className="text-sm text-[var(--text-secondary)] text-center py-4">Aucune action</p>}
              </div>
            </div>

            <div className="bg-[var(--bg-primary)] rounded-2xl border-2 border-[var(--border)] p-6">
              <h2 className="font-bold text-[var(--text-primary)] mb-4">Journal des connexions</h2>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {loginLogs.map((log: any) => (
                  <div key={log.id} className="flex items-center justify-between p-2 rounded-lg bg-[var(--bg-secondary)] text-xs">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${log.success ? 'bg-green-400' : 'bg-red-400'}`} />
                      <span className="text-[var(--text-primary)]">{log.ip}</span>
                    </div>
                    <span className="text-[var(--text-secondary)]">{log.device || log.userAgent?.substring(0, 30) || "Inconnu"} • {new Date(log.createdAt).toLocaleString("fr-FR")}</span>
                  </div>
                ))}
                {loginLogs.length === 0 && <p className="text-sm text-[var(--text-secondary)] text-center py-4">Aucune connexion</p>}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

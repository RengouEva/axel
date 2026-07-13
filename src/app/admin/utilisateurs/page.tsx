"use client"

import { useEffect, useState, useCallback } from "react"
import toast from "react-hot-toast"
import { Users, Shield, Store, User, ArrowLeft, Trash2, Loader2, Search, ChevronDown } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import Button from "@/components/ui/button"
import Link from "next/link"
import { LoadingSpinner } from "@/components/ui/loading-spinner"

interface AdminUser { id: number; name: string; email: string; role: string; createdAt: string }

export default function AdminUsersPage() {
  const { user, getAuthHeaders } = useAuth()
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [deleteConfirm, setDeleteConfirm] = useState<AdminUser | null>(null)
  const [deleting, setDeleting] = useState(false)

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/stats", { headers: getAuthHeaders() })
      const d = await res.json()
      setUsers(d.users || [])
    } catch { toast.error("Erreur chargement utilisateurs") }
    finally { setLoading(false) }
  }, [getAuthHeaders])

  useEffect(() => { if (user?.role === "admin") fetchUsers() }, [user, fetchUsers])

  const handleDelete = async () => {
    if (!deleteConfirm) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/users/${deleteConfirm.id}`, { method: "DELETE", headers: getAuthHeaders() })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || "Erreur") }
      toast.success(`${deleteConfirm.name} supprimé`)
      setDeleteConfirm(null); fetchUsers()
    } catch (err) { toast.error(err instanceof Error ? err.message : "Erreur") }
    finally { setDeleting(false) }
  }

  const handleRoleChange = async (target: AdminUser, newRole: string) => {
    try {
      const res = await fetch(`/api/admin/users/${target.id}`, {
        method: "PUT", headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({ role: newRole }),
      })
      if (!res.ok) throw new Error("Erreur")
      toast.success(`Rôle de ${target.name} changé en ${newRole}`)
      fetchUsers()
    } catch { toast.error("Erreur changement de rôle") }
  }

  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  )

  const roleColors: Record<string, string> = { client: "text-blue-400 bg-blue-500/10", seller: "text-green-400 bg-green-500/10", admin: "text-amber-400 bg-amber-500/10" }
  const roleIcons: Record<string, any> = { client: User, seller: Store, admin: Shield }

  if (!user || user.role !== "admin") {
    return <div className="flex items-center justify-center min-h-[60vh]"><p className="text-[var(--text-secondary)]">Accès restreint</p></div>
  }

  return (
    <div className="p-4 lg:p-8 space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin" className="p-2 rounded-xl bg-[var(--bg-card)] border border-[var(--border)] hover:border-[var(--border-hover)]/30 transition-colors"><ArrowLeft className="w-5 h-5 text-[var(--text-secondary)]" /></Link>
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Utilisateurs</h1>
          <p className="text-sm text-[var(--text-secondary)]">{users.length} inscrits sur la plateforme</p>
        </div>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
        <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher par nom ou email..."
          className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-card)] pl-10 pr-4 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--border-hover)]/30 transition-colors" />
      </div>

      {loading ? <LoadingSpinner className="py-20" size="lg" />
      : filtered.length === 0 ? <p className="text-center text-[var(--text-muted)] py-12">Aucun utilisateur trouvé</p>
      : <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] overflow-hidden">
          <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-[var(--bg-elevated)] border-b border-[var(--border)] text-xs font-semibold text-[var(--text-muted)]">
            <div className="col-span-4">Utilisateur</div>
            <div className="col-span-3">Email</div>
            <div className="col-span-2">Rôle</div>
            <div className="col-span-2">Inscrit le</div>
            <div className="col-span-1">Actions</div>
          </div>
          {filtered.map((u, i) => {
            const RoleIcon = roleIcons[u.role] || User
            return (
              <div key={u.id} className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-[var(--border)] last:border-0 items-center hover:bg-[var(--bg-elevated)] transition-colors">
                <div className="col-span-4 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[var(--bg-elevated)] flex items-center justify-center"><User className="w-4 h-4 text-[var(--text-secondary)]" /></div>
                  <p className="text-sm font-semibold text-[var(--text-primary)]">{u.name}</p>
                </div>
                <div className="col-span-3 text-sm text-[var(--text-secondary)]">{u.email}</div>
                <div className="col-span-2">
                  <div className="relative inline-block">
                    <select value={u.role} onChange={e => handleRoleChange(u, e.target.value)}
                      className={`appearance-none rounded-lg px-2.5 py-1 text-xs font-semibold border border-transparent cursor-pointer ${roleColors[u.role] || "text-[var(--text-secondary)] bg-[var(--bg-elevated)]"}`}>
                      <option value="client">Client</option>
                      <option value="seller">Vendeur</option>
                      <option value="admin">Admin</option>
                    </select>
                    <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none" style={{ color: u.role === "admin" ? "#D97706" : u.role === "seller" ? "#059669" : "#60A5FA" }} />
                  </div>
                </div>
                <div className="col-span-2 text-xs text-[var(--text-muted)]">{new Date(u.createdAt).toLocaleDateString("fr-FR")}</div>
                <div className="col-span-1">
                  {u.id !== user.id && (
                    <button onClick={() => setDeleteConfirm(u)} className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors"><Trash2 className="w-4 h-4" /></button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      }

      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !deleting && setDeleteConfirm(null)} />
          <div className="relative bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl w-full max-w-sm shadow-2xl p-6 text-center">
            <div className="w-12 h-12 rounded-xl bg-red-500/15 flex items-center justify-center mx-auto mb-4"><Trash2 className="w-6 h-6 text-red-400" /></div>
            <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2">Supprimer l'utilisateur</h3>
            <p className="text-sm text-[var(--text-secondary)] mb-6">Êtes-vous sûr de vouloir supprimer <strong className="text-[var(--text-primary)]">{deleteConfirm.name}</strong> ?</p>
            <div className="flex items-center justify-center gap-3">
              <Button variant="outline" size="sm" onClick={() => setDeleteConfirm(null)} disabled={deleting}>Annuler</Button>
              <Button size="sm" onClick={handleDelete} disabled={deleting} className="bg-red-500 hover:bg-red-600 text-white">
                {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : null} Supprimer
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

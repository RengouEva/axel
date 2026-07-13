"use client"

import { useEffect, useState, useCallback } from "react"
import toast from "react-hot-toast"
import { Users, Shield, Store, User, ArrowLeft, Trash2, Loader2 } from "lucide-react"
import { AnimatedDiv } from "@/lib/animations"
import { useAuth } from "@/lib/auth-context"
import Button from "@/components/ui/button"
import Link from "next/link"

interface AdminUser {
  id: number
  name: string
  email: string
  role: string
  createdAt: string
}

export default function AdminUsersPage() {
  const { user, getAuthHeaders } = useAuth()
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteConfirm, setDeleteConfirm] = useState<AdminUser | null>(null)
  const [deleting, setDeleting] = useState(false)

  const headers = getAuthHeaders()

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/stats", { headers })
      const data = await res.json()
      setUsers(data.users || [])
    } catch {
      toast.error( "Erreur lors du chargement")
    } finally {
      setLoading(false)
    }
  }, [headers])

  useEffect(() => {
    if (user?.role === "admin") fetchUsers()
  }, [user, fetchUsers])

  const handleDeleteUser = async () => {
    if (!deleteConfirm) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/users/${deleteConfirm.id}`, {
        method: "DELETE",
        headers,
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Erreur lors de la suppression")
      }
      toast.success( `${deleteConfirm.name} supprimé avec succès`)
      setDeleteConfirm(null)
      fetchUsers()
    } catch (err) {
      toast.error( err instanceof Error ? err.message : "Erreur lors de la suppression")
    } finally {
      setDeleting(false)
    }
  }

  const handleRoleChange = async (targetUser: AdminUser, newRole: string) => {
    try {
      const res = await fetch(`/api/admin/users/${targetUser.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...headers },
        body: JSON.stringify({ role: newRole }),
      })
      if (!res.ok) throw new Error("Erreur lors du changement de rôle")
      toast.success( `Rôle de ${targetUser.name} changé en ${newRole}`)
      fetchUsers()
    } catch {
      toast.error( "Erreur lors du changement de rôle")
    }
  }

  if (!user || user.role !== "admin") {
    return (
      <div className="w-full min-h-screen bg-[var(--bg-secondary)] flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-16 h-16 text-[var(--text-muted)] mx-auto mb-4" />
          <p className="text-[var(--text-secondary)]">Accès restreint</p>
          <Link href="/compte"><Button>Retour</Button></Link>
        </div>
      </div>
    )
  }

  const roleIcons: Record<string, typeof User> = { client: User, seller: Store, admin: Shield }
  const roleColors: Record<string, string> = { client: "#1769F2", seller: "#059669", admin: "#D97706" }

  return (
    <div className="w-full min-h-screen bg-[var(--bg-secondary)]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/admin" className="p-2 rounded-xl bg-[var(--bg-primary)] hover:bg-[var(--bg-secondary)] transition-colors"><ArrowLeft className="w-5 h-5 text-[var(--text-secondary)]" /></Link>
          <div>
            <h1 className="text-4xl font-bold text-[var(--text-primary)]">Utilisateurs</h1>
            <p className="text-[var(--text-secondary)]">{users.length} inscrits sur la plateforme</p>
          </div>
        </div>

        {loading ? (
          <p className="text-center text-[var(--text-secondary)] py-12">Chargement...</p>
        ) : (
          <div className="bg-[var(--bg-primary)] rounded-2xl border-2 border-[var(--border)] overflow-hidden">
            <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-[var(--bg-secondary)] border-b border-[var(--border)] text-xs font-semibold text-[var(--text-secondary)]">
              <div className="col-span-3">Nom</div>
              <div className="col-span-3">Email</div>
              <div className="col-span-2">Rôle</div>
              <div className="col-span-2">Inscrit le</div>
              <div className="col-span-2">Actions</div>
            </div>
            {users.map((u, i) => {
              const RoleIcon = roleIcons[u.role] || User
              const color = roleColors[u.role] || "#64748B"
              const isSelf = u.id === user.id
              return (
                <AnimatedDiv key={u.id} fade slideUp delay={i * 0.02} className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-[var(--border)] last:border-0 items-center hover:bg-[var(--bg-secondary)]/50 transition-colors">
                  <div className="col-span-3 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${color}15` }}>
                      <RoleIcon className="w-4 h-4" style={{ color }} />
                    </div>
                    <span className="text-sm font-semibold text-[var(--text-primary)]">{u.name}</span>
                  </div>
                  <div className="col-span-3 text-sm text-[var(--text-secondary)]">{u.email}</div>
                  <div className="col-span-2">
                    {isSelf ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize" style={{ backgroundColor: `${color}15`, color }}>
                        {u.role === "seller" ? "Vendeur" : u.role === "admin" ? "Admin" : "Client"}
                      </span>
                    ) : (
                      <select
                        value={u.role}
                        onChange={(e) => handleRoleChange(u, e.target.value)}
                        className="px-2 py-1 rounded-xl text-[10px] font-semibold border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-primary)] cursor-pointer focus:outline-none focus:ring-2 focus:ring-[var(--text-link)]/30"
                        style={{ backgroundColor: `${color}15`, color }}
                      >
                        <option value="client">Client</option>
                        <option value="seller">Vendeur</option>
                        <option value="admin">Admin</option>
                      </select>
                    )}
                  </div>
                  <div className="col-span-2 text-xs text-[var(--text-secondary)]">{new Date(u.createdAt).toLocaleDateString("fr-FR")}</div>
                  <div className="col-span-2">
                    {!isSelf && (
                      <button
                        onClick={() => setDeleteConfirm(u)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-red-400 bg-red-500/10 hover:bg-red-500/20 transition-colors"
                      >
                        <Trash2 className="w-3 h-3" /> Supprimer
                      </button>
                    )}
                  </div>
                </AnimatedDiv>
              )
            })}
          </div>
        )}
      </div>

      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !deleting && setDeleteConfirm(null)} />
          <div className="relative bg-[var(--bg-primary)] border-2 border-[var(--border)] rounded-2xl w-full max-w-sm shadow-2xl p-6 text-center">
            <div className="w-12 h-12 rounded-xl bg-red-500/15 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6 text-red-400" />
            </div>
            <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2">Supprimer l'utilisateur</h3>
            <p className="text-sm text-[var(--text-secondary)] mb-6">
              Êtes-vous sûr de vouloir supprimer <strong className="text-[var(--text-primary)]">{deleteConfirm.name}</strong> ? Cette action est irréversible.
            </p>
            <div className="flex items-center justify-center gap-3">
              <Button variant="outline" size="sm" onClick={() => setDeleteConfirm(null)} disabled={deleting}>
                Annuler
              </Button>
              <Button size="sm" onClick={handleDeleteUser} disabled={deleting}
                className="bg-red-500 hover:bg-red-600 text-white">
                {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Supprimer
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

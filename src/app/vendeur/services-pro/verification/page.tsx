"use client"

import { useState, useEffect } from "react"
import { ShieldCheck, Upload, CheckCircle, XCircle, Clock, Loader2 } from "lucide-react"
import Button from "@/components/ui/button"
import toast from "react-hot-toast"
import { useAuth } from "@/lib/auth-context"
import type { SellerVerification } from "@/lib/services-pro-types"

interface VerificationResponse {
  verification: SellerVerification | null
}

export default function VerificationPage() {
  const { getAuthHeaders } = useAuth()
  const [verification, setVerification] = useState<SellerVerification | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({ verificationType: "individual", idType: "CNI", idNumber: "", businessRegNumber: "", taxId: "" })

  useEffect(() => {
    fetch("/api/vendeur/services-pro/verification", { headers: getAuthHeaders() })
      .then(async r => { if (!r.ok) { const err = await r.json(); toast.error(err.error || "Une erreur est survenue"); setLoading(false); return }; return r.json() })
      .then(d => { if (d) { setVerification(d.verification); setLoading(false) } })
      .catch(() => { toast.error("Une erreur est survenue"); setLoading(false) })
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const res = await fetch("/api/vendeur/services-pro/verification", {
        method: "POST", headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error || "Une erreur est survenue"); return }
      setVerification(data.verification)
      toast.success(data.message || "Demande envoyée")
    } catch { toast.error("Une erreur est survenue") } finally { setSubmitting(false) }
  }

  if (loading) return <div className="w-full min-h-screen bg-[var(--bg-secondary)] flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin" style={{ color: "var(--text-link)" }} /></div>

  return (
    <div className="w-full min-h-screen bg-[var(--bg-secondary)] p-6">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <ShieldCheck className="w-8 h-8 text-[var(--text-link)]" />
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">Vérification Professionnelle</h1>
            <p className="text-sm text-[var(--text-secondary)]">Obtenez le badge Vendeur Vérifié</p>
          </div>
        </div>

        {verification?.status === "approved" ? (
          <div className="p-8 rounded-2xl bg-green-500/10 border-2 border-green-500/20 text-center">
            <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-green-400 mb-2">✅ Vendeur Vérifié</h2>
            <p className="text-[var(--text-secondary)]">Votre identité a été vérifiée avec succès.</p>
            {verification.expiresAt && <p className="text-xs text-[var(--text-secondary)] mt-2">Valide jusqu'au {new Date(verification.expiresAt).toLocaleDateString("fr-FR")}</p>}
          </div>
        ) : verification?.status === "pending" ? (
          <div className="p-8 rounded-2xl bg-yellow-500/10 border-2 border-yellow-500/20 text-center">
            <Clock className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-yellow-400 mb-2">Vérification en cours</h2>
            <p className="text-[var(--text-secondary)]">Votre demande est en cours de traitement.</p>
          </div>
        ) : verification?.status === "rejected" ? (
          <div className="p-8 rounded-2xl bg-red-500/10 border-2 border-red-500/20 text-center mb-6">
            <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-red-400 mb-2">Vérification refusée</h2>
            <p className="text-[var(--text-secondary)]">{verification.rejectionReason || "Veuillez soumettre à nouveau avec des documents valides."}</p>
          </div>
        ) : null}

        {(!verification || verification.status === "rejected") && (
          <form onSubmit={handleSubmit} className="bg-[var(--bg-primary)] rounded-2xl border-2 border-[var(--border)] p-6 space-y-4">
            <h2 className="font-bold text-[var(--text-primary)]">Soumettre une demande de vérification</h2>

            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">Type de vérification</label>
              <select value={form.verificationType} onChange={e => setForm(f => ({ ...f, verificationType: e.target.value }))}
                className="w-full rounded-xl border-2 border-[var(--border)] bg-[var(--bg-primary)] px-4 py-3 text-[var(--text-primary)]">
                <option value="individual">Particulier</option>
                <option value="business">Entreprise</option>
              </select>
            </div>

            {form.verificationType === "business" && (
              <>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">Numéro de registre de commerce</label>
                  <input value={form.businessRegNumber} onChange={e => setForm(f => ({ ...f, businessRegNumber: e.target.value }))} placeholder="RC-..." className="w-full rounded-xl border-2 border-[var(--border)] bg-[var(--bg-secondary)] px-4 py-3 text-sm text-[var(--text-primary)]" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">Numéro fiscal</label>
                  <input value={form.taxId} onChange={e => setForm(f => ({ ...f, taxId: e.target.value }))} placeholder="NU-..." className="w-full rounded-xl border-2 border-[var(--border)] bg-[var(--bg-secondary)] px-4 py-3 text-sm text-[var(--text-primary)]" />
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">Type de pièce d'identité</label>
              <select value={form.idType} onChange={e => setForm(f => ({ ...f, idType: e.target.value }))}
                className="w-full rounded-xl border-2 border-[var(--border)] bg-[var(--bg-primary)] px-4 py-3 text-[var(--text-primary)]">
                <option value="CNI">Carte Nationale d'Identité</option>
                <option value="Passeport">Passeport</option>
                <option value="Permis">Permis de Conduire</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">Numéro de pièce</label>
              <input value={form.idNumber} onChange={e => setForm(f => ({ ...f, idNumber: e.target.value }))} placeholder="Numéro de la pièce" required className="w-full rounded-xl border-2 border-[var(--border)] bg-[var(--bg-secondary)] px-4 py-3 text-sm text-[var(--text-primary)]" />
            </div>

            <div className="pt-2">
              <Button type="submit" disabled={submitting} fullWidth>
                {submitting ? "Envoi en cours..." : "Soumettre la demande"}
              </Button>
            </div>

            <p className="text-xs text-[var(--text-secondary)]">La vérification peut prendre jusqu'à 48h ouvrées. Elle n'affecte pas le classement organique de vos produits.</p>
          </form>
        )}
      </div>
    </div>
  )
}

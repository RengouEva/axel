"use client"

import { useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Check, CreditCard, Shield, Loader } from "lucide-react"
import Button from "@/components/ui/button"

export default function DemoPaymentPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const reference = searchParams.get("reference") || ""
  const orderId = searchParams.get("orderId") || ""
  const amount = searchParams.get("amount") || "0"
  const callbackUrl = searchParams.get("callbackUrl") || ""

  const handleConfirm = () => {
    setLoading(true)
    const separator = callbackUrl.includes("?") ? "&" : "?"
    const url = callbackUrl.includes("reference=")
      ? callbackUrl
      : `${callbackUrl}${separator}reference=${reference}`
    router.push(url)
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border-2 border-[var(--border)] p-8 text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-r from-indigo-500 to-blue-500 flex items-center justify-center mx-auto">
            <CreditCard className="w-8 h-8 text-white" aria-hidden="true" />
          </div>

          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">Paiement Démo</h1>
            <p className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2 mt-3">
              Mode démonstration — aucune transaction réelle
            </p>
          </div>

          <div className="rounded-xl bg-[var(--bg-secondary)] p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-[var(--text-secondary)]">Référence</span>
              <span className="font-mono font-medium text-[var(--text-primary)]">{reference}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--text-secondary)]">Commande</span>
              <span className="font-medium text-[var(--text-primary)]">{orderId}</span>
            </div>
            <hr className="border-[var(--border)]" />
            <div className="flex justify-between">
              <span className="font-semibold text-[var(--text-primary)]">Montant</span>
              <span className="font-bold text-lg text-[var(--text-link)]">{parseInt(amount).toLocaleString("fr-FR")} F</span>
            </div>
          </div>

          <div className="flex items-center gap-2 justify-center text-sm text-[var(--text-secondary)]">
            <Shield className="w-4 h-4" aria-hidden="true" />
            <span>Environnement de test sécurisé</span>
          </div>

          <Button size="lg" fullWidth onClick={handleConfirm} disabled={loading}>
            {loading ? <Loader className="w-5 h-5 animate-spin" aria-hidden="true" /> : <Check className="w-5 h-5" aria-hidden="true" />}
            {loading ? "Traitement..." : "Confirmer le paiement (Démo)"}
          </Button>

          <p className="text-xs text-[var(--text-secondary)]">
            En production, vous serez redirigé vers une plateforme de paiement sécurisée (Flutterwave, Paystack, etc.)
          </p>
        </div>
      </div>
    </div>
  )
}

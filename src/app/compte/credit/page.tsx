"use client"

import { useState, useEffect } from "react"
import { CreditCard, CheckCircle, Clock, AlertCircle, ArrowLeft, Download, Calendar, Package } from "lucide-react"
import Button from "@/components/ui/button"
import { AnimatedDiv } from "@/lib/animations"
import Link from "next/link"

interface CreditApplication {
  id: string
  date: string
  productName: string
  price: number
  duration: number
  rate: number
  monthlyPayment: number
  totalRepayment: number
  status: string
  applicant: {
    fullName: string
    email: string
    phone: string
    monthlyIncome: string
  }
}

export default function CreditPage() {
  const [activeTab, setActiveTab] = useState<"en-cours" | "historique">("en-cours")
  const [applications, setApplications] = useState<CreditApplication[]>([])

  useEffect(() => {
    const stored = localStorage.getItem("creditApplications")
    if (stored) {
      try {
        setApplications(JSON.parse(stored))
      } catch { /* ignore */ }
    }
  }, [])

  const activeApplications = applications.filter((a) => a.status === "pre-approved" || a.status === "approved")
  const pastApplications = applications.filter((a) => a.status === "completed" || a.status === "rejected")

  const nextDate = new Date()
  nextDate.setDate(15)
  if (nextDate < new Date()) nextDate.setMonth(nextDate.getMonth() + 1)

  const currentCredit = applications[0] ? {
    total: applications[0].totalRepayment,
    restant: Math.round(applications[0].totalRepayment * 2 / 3),
    mensualite: applications[0].monthlyPayment,
    prochaineEcheance: nextDate.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }),
    taux: applications[0].rate,
    duree: applications[0].duration,
    moisRestants: Math.round(applications[0].duration * 2 / 3),
    statut: applications[0].status === "pre-approved" ? "Pré-approuvé" : "Actif",
  } : null

  const echeances = currentCredit
    ? Array.from({ length: 4 }, (_, i) => ({
        date: new Date(Date.now() - i * 30 * 24 * 60 * 60 * 1000).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }),
        montant: currentCredit.mensualite,
        statut: i < 2 ? "Payé" : "À venir",
      }))
    : []

  return (
    <div className="w-full min-h-screen bg-[var(--bg-primary)]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/compte" className="p-2 rounded-xl hover:bg-[var(--bg-secondary)] transition-colors"><ArrowLeft className="w-5 h-5 text-[var(--text-secondary)]" /></Link>
          <h1 className="text-4xl font-bold text-[var(--text-primary)]">Mon crédit</h1>
        </div>

        {!currentCredit ? (
          <AnimatedDiv fade slideUp className="text-center py-16">
            <div className="w-20 h-20 rounded-2xl bg-[var(--bg-secondary)] flex items-center justify-center mx-auto mb-4">
              <CreditCard className="w-10 h-10 text-[var(--text-secondary)]" />
            </div>
            <h2 className="text-xl font-bold text-[var(--text-primary)] mb-2">Aucun crédit en cours</h2>
            <p className="text-[var(--text-secondary)] mb-6">Vous n&apos;avez pas encore de demande de crédit.</p>
            <Link href="/a-credit">
              <Button size="lg">Faire une simulation</Button>
            </Link>
          </AnimatedDiv>
        ) : (
          <>
            <AnimatedDiv fade slideUp className="gradient-axel rounded-2xl p-6 text-white mb-8">
              <div className="flex items-center gap-3 mb-4">
                <CreditCard className="w-6 h-6" />
                <span className="text-white/80 text-sm">Crédit en cours</span>
                <span className="ml-auto px-3 py-1 rounded-full bg-white/20 text-xs font-semibold">{currentCredit.statut}</span>
              </div>
              <p className="text-4xl font-bold mb-1">{currentCredit.restant.toLocaleString("fr-FR")} F</p>
              <p className="text-white/60 text-sm mb-4">Reste à payer sur {currentCredit.total.toLocaleString("fr-FR")} F</p>
              <div className="p-3 rounded-xl bg-white/10 mb-4 flex items-center gap-3">
                <Package className="w-5 h-5 text-white/70" />
                <div>
                  <p className="text-sm font-semibold">{applications[0].productName}</p>
                  <p className="text-xs text-white/60">Demande du {new Date(applications[0].date).toLocaleDateString("fr-FR")}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><p className="text-white/60">Mensualité</p><p className="font-semibold">{currentCredit.mensualite.toLocaleString("fr-FR")} F</p></div>
                <div><p className="text-white/60">Prochaine échéance</p><p className="font-semibold">{currentCredit.prochaineEcheance}</p></div>
                <div><p className="text-white/60">Durée restante</p><p className="font-semibold">{currentCredit.moisRestants} mois</p></div>
                <div><p className="text-white/60">Taux d'intérêt</p><p className="font-semibold">{currentCredit.taux}%</p></div>
              </div>
            </AnimatedDiv>

            {applications.length > 1 && (
              <AnimatedDiv fade slideUp className="mb-6 p-4 rounded-2xl border-2 border-[var(--border)]">
                <h3 className="font-semibold text-[var(--text-primary)] mb-3">Autres demandes</h3>
                <div className="space-y-2">
                  {applications.slice(1, 4).map((app) => (
                    <div key={app.id} className="flex items-center justify-between p-2">
                      <div>
                        <p className="text-sm font-semibold text-[var(--text-primary)]">{app.productName}</p>
                        <p className="text-xs text-[var(--text-secondary)]">{app.price.toLocaleString("fr-FR")} F • {app.duration} mois</p>
                      </div>
                      <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
                        app.status === "pre-approved" ? "text-yellow-600 bg-yellow-50" : "text-red-600 bg-red-50"
                      }`}>
                        {app.status === "pre-approved" ? "En attente" : "Refusé"}
                      </span>
                    </div>
                  ))}
                </div>
              </AnimatedDiv>
            )}

            <div className="flex gap-2 mb-6">
              <button onClick={() => setActiveTab("en-cours")} className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${activeTab === "en-cours" ? "gradient-axel text-white" : "bg-[var(--bg-secondary)] text-[var(--text-secondary)]"}`}>Échéances</button>
              <button onClick={() => setActiveTab("historique")} className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${activeTab === "historique" ? "gradient-axel text-white" : "bg-[var(--bg-secondary)] text-[var(--text-secondary)]"}`}>Historique</button>
            </div>

            {activeTab === "en-cours" ? (
              <div className="space-y-3">
                {echeances.length > 0 ? (
                  echeances.map((e, i) => (
                    <div key={i} className="flex items-center justify-between p-4 rounded-2xl border-2 border-[var(--border)]">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${e.statut === "Payé" ? "bg-green-50" : "bg-[var(--bg-secondary)]"}`}>
                          {e.statut === "Payé" ? <CheckCircle className="w-5 h-5 text-green-500" /> : <Clock className="w-5 h-5 text-[var(--text-link)]" />}
                        </div>
                        <div><p className="font-semibold text-[var(--text-primary)] text-sm">{e.date}</p><p className="text-xs text-[var(--text-secondary)]">{e.montant.toLocaleString("fr-FR")} F</p></div>
                      </div>
                      <span className={`text-xs font-semibold px-3 py-1 rounded-full ${e.statut === "Payé" ? "text-green-600 bg-green-50" : "text-[var(--text-link)] bg-blue-50"}`}>{e.statut}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-[var(--text-secondary)] py-8">Aucune échéance disponible.</p>
                )}
                <Button variant="outline" fullWidth><Download className="w-4 h-4" /> Télécharger mon échéancier</Button>
              </div>
            ) : (
              <div className="space-y-3">
                {applications.map((h) => (
                  <div key={h.id} className="flex items-center justify-between p-4 rounded-2xl border-2 border-[var(--border)]">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[var(--bg-secondary)] flex items-center justify-center"><Calendar className="w-5 h-5 text-[var(--text-link)]" /></div>
                      <div>
                        <p className="font-semibold text-[var(--text-primary)] text-sm">{h.productName}</p>
                        <p className="text-xs text-[var(--text-secondary)]">{new Date(h.date).toLocaleDateString("fr-FR")} • {h.price.toLocaleString("fr-FR")} F</p>
                      </div>
                    </div>
                    <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
                      h.status === "pre-approved" ? "text-yellow-600 bg-yellow-50" :
                      h.status === "approved" ? "text-green-600 bg-green-50" :
                      h.status === "completed" ? "text-green-600 bg-green-50" :
                      "text-red-600 bg-red-50"
                    }`}>
                      {h.status === "pre-approved" ? "Pré-approuvé" :
                       h.status === "approved" ? "Approuvé" :
                       h.status === "completed" ? "Terminé" : "Refusé"}
                    </span>
                  </div>
                ))}
                {applications.length === 0 && (
                  <p className="text-center text-[var(--text-secondary)] py-8">Aucun historique.</p>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

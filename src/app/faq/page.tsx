"use client"

import { useState } from "react"
import { ChevronDown, HelpCircle, Search } from "lucide-react"
import Input from "@/components/ui/input"
import { AnimatedDiv } from "@/lib/animations"

const faqs = [
  { q: "Comment fonctionne le paiement à crédit ?", a: "AXEL vous permet d'acheter vos produits immédiatement et de payer en mensualités de 3 à 36 mois. La simulation est instantanée, sans engagement. Une fois votre dossier validé (5 minutes), vous recevez votre produit sous 48h." },
  { q: "Quels sont les documents nécessaires pour un crédit ?", a: "Pour une demande de crédit, vous aurez besoin d'une pièce d'identité valide, d'un justificatif de domicile récent et d'une preuve de revenus (bulletins de salaire ou relevés bancaires)." },
  { q: "Quels sont les moyens de paiement acceptés ?", a: "Nous acceptons les cartes Visa et Mastercard, Orange Money, MTN Mobile Money, Wave, et PayPal. Tous les paiements sont 100% sécurisés." },
  { q: "Quels sont les délais de livraison ?", a: "La livraison standard prend 3 à 5 jours ouvrés. L'option express vous livre sous 24-48h. La livraison est gratuite pour toute commande de 50 000 F et plus." },
  { q: "Puis-je retourner un produit ?", a: "Oui, vous disposez de 30 jours pour changer d'avis. Les retours sont gratuits et le remboursement est effectué sous 48h après réception du produit." },
  { q: "Comment suivre ma commande ?", a: "Une fois votre commande validée, vous recevrez un email avec un numéro de suivi. Vous pouvez également suivre vos commandes depuis votre espace client." },
  { q: "Puis-je annuler une demande de crédit ?", a: "Oui, vous pouvez annuler votre demande de crédit à tout moment avant la signature électronique du contrat. Après signature, un délai de rétractation de 14 jours s'applique." },
  { q: "Comment devenir vendeur sur AXEL ?", a: "Pour devenir vendeur, créez un compte professionnel depuis notre page dédiée. Après validation de votre dossier sous 48h, vous pourrez publier vos produits et gérer vos ventes." },
]

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  const [searchQuery, setSearchQuery] = useState("")

  const filtered = faqs.filter(f =>
    f.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.a.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="w-full min-h-screen bg-[var(--bg-primary)]">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AnimatedDiv fade slideUp className="text-center mb-12">
          <div className="w-16 h-16 rounded-2xl bg-[var(--text-link)]/10 flex items-center justify-center mx-auto mb-4">
            <HelpCircle className="w-8 h-8 text-[var(--text-link)]" />
          </div>
          <h1 className="text-4xl sm:text-4xl font-bold text-[var(--text-primary)] mb-2">Questions fréquentes</h1>
          <p className="text-[var(--text-secondary)]">Tout ce que vous devez savoir sur AXEL Marketplace</p>
        </AnimatedDiv>

        <div className="relative mb-8">
          <Input icon={<Search className="w-5 h-5" />} placeholder="Rechercher une question..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="bg-[var(--bg-secondary)]" />
        </div>

        <div className="space-y-3">
          {filtered.map((faq, i) => (
            <AnimatedDiv key={i} fade slideUp delay={i * 0.03}>
              <button onClick={() => setOpenIndex(openIndex === i ? null : i)} className="w-full text-left p-5 rounded-2xl border-2 border-[var(--border)] hover:border-[var(--border-hover)]/20 transition-all">
                <div className="flex items-center justify-between gap-4">
                  <span className="font-semibold text-[var(--text-primary)]">{faq.q}</span>
                  <ChevronDown className={`w-5 h-5 text-[var(--text-secondary)] shrink-0 transition-transform ${openIndex === i ? "rotate-180" : ""}`} />
                </div>
                {openIndex === i && (
                  <p className="mt-4 text-sm text-[var(--text-secondary)] leading-relaxed border-t border-[var(--border)] pt-4">{faq.a}</p>
                )}
              </button>
            </AnimatedDiv>
          ))}
        </div>
      </div>
    </div>
  )
}

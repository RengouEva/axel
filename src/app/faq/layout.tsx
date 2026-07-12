import type { Metadata } from "next"
import { FaqSchema } from "@/lib/seo"

export const metadata: Metadata = {
  title: "Foire aux questions",
  description: "Trouvez les réponses à vos questions sur AXEL Marketplace : commandes, livraison, crédit, retours et plus.",
  openGraph: {
    title: "FAQ | AXEL Marketplace",
    description: "Tout ce que vous devez savoir.",
  },
}

const faqs = [
  { question: "Comment fonctionne le paiement à crédit ?", answer: "AXEL vous permet d'acheter vos produits immédiatement et de payer en mensualités de 3 à 36 mois. La simulation est instantanée, sans engagement." },
  { question: "Quels sont les documents nécessaires pour un crédit ?", answer: "Pièce d'identité valide, justificatif de domicile récent et preuve de revenus." },
  { question: "Quels sont les moyens de paiement acceptés ?", answer: "Visa, Mastercard, Orange Money, MTN Mobile Money, Wave et PayPal." },
  { question: "Quels sont les délais de livraison ?", answer: "Standard : 3-5 jours ouvrés. Express : 24-48h. Gratuite dès 50 000 F." },
  { question: "Puis-je retourner un produit ?", answer: "Oui, 30 jours pour changer d'avis. Retours gratuits, remboursement sous 48h." },
  { question: "Comment suivre ma commande ?", answer: "Email avec numéro de suivi + espace client sur le site." },
]

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <FaqSchema questions={faqs} />
      {children}
    </>
  )
}

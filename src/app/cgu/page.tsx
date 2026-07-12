"use client"

import { AnimatedDiv } from "@/lib/animations"
import { Scale } from "lucide-react"

export default function CGUPage() {
  return (
    <div className="w-full min-h-screen bg-[var(--bg-primary)]">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AnimatedDiv fade slideUp className="text-center mb-12">
          <div className="w-16 h-16 rounded-2xl bg-[var(--text-link)]/10 flex items-center justify-center mx-auto mb-4"><Scale className="w-8 h-8 text-[var(--text-link)]" /></div>
          <h1 className="text-4xl sm:text-4xl font-bold text-[var(--text-primary)] mb-2">Conditions Générales d'Utilisation</h1>
          <p className="text-[var(--text-secondary)]">Dernière mise à jour : Juillet 2026</p>
        </AnimatedDiv>

        <div className="space-y-8 text-[var(--text-secondary)] text-sm leading-relaxed">
          {[
            { title: "1. Acceptation des conditions", content: "En accédant et en utilisant AXEL Marketplace, vous acceptez d'être lié par les présentes CGU. Si vous n'acceptez pas ces conditions, veuillez ne pas utiliser nos services." },
            { title: "2. Services proposés", content: "AXEL Marketplace est une plateforme de e-commerce permettant l'achat de produits avec paiement comptant ou à crédit. Nous facilitons la mise en relation entre acheteurs et vendeurs." },
            { title: "3. Crédit et financement", content: "Le crédit est accordé sous réserve d'acceptation de votre dossier. Les conditions de crédit (taux, durée, mensualités) sont clairement indiquées avant validation. Tout crédit souscrit est soumis à un contrat de crédit séparé." },
            { title: "4. Compte utilisateur", content: "Vous êtes responsable de la confidentialité de vos identifiants de connexion. Toute activité sur votre compte est présumée émaner de vous." },
            { title: "5. Commandes et livraisons", content: "Les commandes sont confirmées après validation du paiement. Les délais de livraison sont donnés à titre indicatif et peuvent varier selon la destination." },
            { title: "6. Retours et remboursements", content: "Conformément à notre politique de retour, vous disposez de 30 jours pour retourner un produit. Les remboursements sont effectués sous 48h ouvrées." },
            { title: "7. Protection des données", content: "Vos données personnelles sont traitées conformément à notre politique de confidentialité. Nous utilisons des mesures de sécurité avancées pour protéger vos informations." },
            { title: "8. Contact", content: "Pour toute question relative aux CGU, contactez-nous à l'adresse : contact@axel.marketplace" },
          ].map((section, i) => (
            <AnimatedDiv key={i} fade slideUp delay={i * 0.03}>
              <h2 className="text-lg font-bold text-[var(--text-primary)] mb-2">{section.title}</h2>
              <p>{section.content}</p>
            </AnimatedDiv>
          ))}
        </div>
      </div>
    </div>
  )
}

"use client"

import { AnimatedDiv } from "@/lib/animations"
import { Shield } from "lucide-react"

export default function PrivacyPage() {
  return (
    <div className="w-full min-h-screen bg-[var(--bg-primary)]">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AnimatedDiv fade slideUp className="text-center mb-12">
          <div className="w-16 h-16 rounded-2xl bg-[var(--text-link)]/10 flex items-center justify-center mx-auto mb-4"><Shield className="w-8 h-8 text-[var(--text-link)]" /></div>
          <h1 className="text-4xl sm:text-4xl font-bold text-[var(--text-primary)] mb-2">Politique de Confidentialité</h1>
          <p className="text-[var(--text-secondary)]">Dernière mise à jour : Juillet 2026</p>
        </AnimatedDiv>

        <div className="space-y-8 text-[var(--text-secondary)] text-sm leading-relaxed">
          {[
            { title: "1. Collecte des données", content: "Nous collectons les données nécessaires au traitement de vos commandes et à la gestion de votre compte : nom, email, adresse, téléphone, informations de paiement." },
            { title: "2. Utilisation des données", content: "Vos données sont utilisées pour le traitement des commandes, la gestion du crédit, l'envoi de notifications importantes et l'amélioration de nos services." },
            { title: "3. Sécurité des données", content: "Nous utilisons des protocoles de sécurité avancés (chiffrement SSL/TLS, stockage sécurisé) pour protéger vos informations personnelles et bancaires." },
            { title: "4. Partage des données", content: "Nous ne partageons jamais vos données avec des tiers non autorisés. Les informations nécessaires au traitement du crédit sont transmises à nos partenaires financiers agréés." },
            { title: "5. Cookies", content: "Nous utilisons des cookies essentiels au fonctionnement de la plateforme. Vous pouvez configurer vos préférences de cookies depuis les paramètres de votre navigateur." },
            { title: "6. Vos droits", content: "Vous disposez d'un droit d'accès, de rectification et de suppression de vos données. Pour exercer ces droits, contactez notre DPO à dpo@axel.marketplace." },
            { title: "7. Conservation des données", content: "Vos données sont conservées pendant la durée de votre compte et pour les obligations légales (5 ans pour les données financières)." },
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

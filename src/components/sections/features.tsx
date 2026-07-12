"use client"

import { CreditCard, Shield, Clock, TrendingUp, Gift, Truck } from "lucide-react"
import { AnimatedDiv } from "@/lib/animations"

const features = [
  {
    icon: CreditCard,
    title: "Paiement à crédit",
    description: "Achetez maintenant et payez en 3 à 36 mois. Simulation instantanée sans engagement.",
    color: "#1769F2"
  },
  {
    icon: Shield,
    title: "Paiement sécurisé",
    description: "Transactions 100% sécurisées. Vos données bancaires sont protégées en permanence.",
    color: "#061A4A"
  },
  {
    icon: Clock,
    title: "Livraison rapide",
    description: "Livraison en 24 à 72h partout. Suivi en temps réel de votre commande.",
    color: "#1769F2"
  },
  {
    icon: TrendingUp,
    title: "Meilleurs prix",
    description: "Prix négociés directement avec les marques. Économies garanties.",
    color: "#0B4FC8"
  },
  {
    icon: Gift,
    title: "Programme fidélité",
    description: "Cumulez des points sur chaque achat. Échangez-les contre des réductions exclusives.",
    color: "#1769F2"
  },
  {
    icon: Truck,
    title: "Retours gratuits",
    description: "30 jours pour changer d'avis. Retours gratuits et remboursement rapide.",
    color: "#0B4FC8"
  }
]

export default function Features() {
  return (
    <section className="py-12 sm:py-16 lg:py-20 bg-[var(--bg-primary)]">
      <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        <AnimatedDiv fade slideUp className="text-center mb-10 sm:mb-16">
          <span className="text-[var(--text-link)] font-semibold text-xs sm:text-sm tracking-wider uppercase mb-2 block">
            Pourquoi AXEL
          </span>
          <h2 className="text-2xl sm:text-4xl lg:text-4xl font-bold text-[var(--text-primary)]">
            Une expérience d&apos;achat premium
          </h2>
          <p className="text-[var(--text-secondary)] mt-2 sm:mt-3 max-w-xl mx-auto text-sm sm:text-base">
            Tout ce dont vous avez besoin pour acheter en toute confiance
          </p>
        </AnimatedDiv>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon

            return (
              <AnimatedDiv
                key={feature.title}
                fade
                slideUp
                delay={index * 0.1}
                className="group p-8 rounded-2xl border-2 border-[var(--border)] 
                  hover:border-[var(--border-hover)]/30 transition-all duration-300
                  hover:shadow-axel-lg"
              >
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5
                    group-hover:scale-110 transition-transform duration-300"
                  style={{ backgroundColor: `${feature.color}10` }}
                >
                  <Icon className="w-6 h-6" style={{ color: feature.color }} />
                </div>
                <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                  {feature.description}
                </p>
              </AnimatedDiv>
            )
          })}
        </div>
      </div>
    </section>
  )
}
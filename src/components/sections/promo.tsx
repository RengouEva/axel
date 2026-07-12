"use client"

import { ArrowRight, CreditCard, Calculator, CheckCircle } from "lucide-react"
import Button from "@/components/ui/button"
import { AnimatedDiv } from "@/lib/animations"
import Link from "next/link"

const steps = [
  {
    icon: CreditCard,
    title: "Choisissez votre produit",
    description: "Parcourez notre catalogue et sélectionnez l'article qui vous fait envie."
  },
  {
    icon: Calculator,
    title: "Simulez votre crédit",
    description: "Choisissez la durée de 3 à 36 mois. Voyez votre mensualité en temps réel."
  },
  {
    icon: CheckCircle,
    title: "Recevez chez vous",
    description: "Validez votre dossier en 5 minutes. Recevez votre produit sous 48h."
  }
]

export default function Promo() {
  return (
    <section className="py-12 sm:py-16 lg:py-20 relative overflow-hidden">
      <div className="absolute inset-0 gradient-axel opacity-95" />
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNCI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />

      <div className="relative w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        <AnimatedDiv fade slideUp className="text-center mb-10 sm:mb-16">
          <span className="text-white/60 font-semibold text-xs sm:text-sm tracking-wider uppercase mb-2 block">
            Paiement à crédit
          </span>
          <h2 className="text-2xl sm:text-4xl lg:text-4xl font-bold text-white mb-3 sm:mb-4">
            Comment ça marche ?
          </h2>
          <p className="text-white/60 max-w-xl mx-auto text-sm sm:text-base">
            Obtenez votre crédit en 3 étapes simples. Sans frais cachés, sans stress.
          </p>
        </AnimatedDiv>

        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 mb-10 sm:mb-12">
          {steps.map((step, index) => {
            const Icon = step.icon

            return (
              <AnimatedDiv
                key={step.title}
                fade
                slideUp
                delay={index * 0.15}
                className="relative text-center p-6 sm:p-8 rounded-2xl bg-white/5 backdrop-blur-sm 
                  border border-white/10 hover:bg-white/10 transition-all duration-300"
              >
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-[var(--text-link)] 
                  flex items-center justify-center text-white font-bold text-sm shadow-lg">
                  {index + 1}
                </div>
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white/10 flex items-center justify-center mx-auto mb-4 sm:mb-5 mt-2">
                  <Icon className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-white mb-2">{step.title}</h3>
                <p className="text-white/50 text-xs sm:text-sm leading-relaxed">{step.description}</p>
              </AnimatedDiv>
            )
          })}
        </div>

        <AnimatedDiv fade slideUp className="text-center">
          <Link href="/a-credit">
            <Button size="lg" variant="secondary" className="bg-[var(--bg-primary)] text-[var(--text-primary)] group shadow-2xl">
              Simuler mon crédit
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
          <p className="text-white/40 text-sm mt-4">
            Sans engagement. Vérification instantanée.
          </p>
        </AnimatedDiv>
      </div>
    </section>
  )
}
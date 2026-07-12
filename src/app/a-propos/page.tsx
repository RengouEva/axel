"use client"

import { Shield, Users, CreditCard, TrendingUp, Globe, Award } from "lucide-react"
import { AnimatedDiv } from "@/lib/animations"

const values = [
  { icon: Shield, title: "Confiance", desc: "La confiance est au coeur de notre plateforme. Chaque transaction est sécurisée." },
  { icon: CreditCard, title: "Crédit accessible", desc: "Rendez vos achats possibles grâce à notre système de paiement à crédit flexible." },
  { icon: Users, title: "Communauté", desc: "Une marketplace qui connecte acheteurs et vendeurs de toute l'Afrique." },
  { icon: TrendingUp, title: "Innovation", desc: "Une expérience d'achat moderne, fluide et technologiquement avancée." },
  { icon: Globe, title: "Panafricain", desc: "Présent dans toute l'Afrique, avec des livraisons rapides et fiables." },
  { icon: Award, title: "Qualité", desc: "Des produits authentiques, vérifiés et garantis. Satisfaction ou remboursé." },
]

export default function AboutPage() {
  return (
    <div className="w-full min-h-screen bg-[var(--bg-primary)]">
      <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AnimatedDiv fade slideUp className="text-center mb-16">
          <h1 className="text-4xl sm:text-5xl font-bold text-[var(--text-primary)] mb-4">À propos d'AXEL</h1>
          <p className="text-[var(--text-secondary)] text-lg max-w-2xl mx-auto">La marketplace qui révolutionne l'accès aux produits de qualité grâce au paiement à crédit.</p>
        </AnimatedDiv>

        <div className="grid lg:grid-cols-2 gap-12 items-center mb-20">
          <AnimatedDiv fade slideUp>
            <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">Notre mission</h2>
            <p className="text-[var(--text-secondary)] leading-relaxed mb-4">AXEL Marketplace est née d'une vision simple : rendre les produits de qualité accessibles à tous. Nous croyons que chacun mérite de pouvoir s'offrir ce dont il a besoin, quand il en a besoin.</p>
            <p className="text-[var(--text-secondary)] leading-relaxed">Grâce à notre système de paiement à crédit transparent et flexible, nous permettons à des milliers de clients d'acquérir smartphones, ordinateurs, électroménager et bien plus encore, sans attendre.</p>
          </AnimatedDiv>
          <AnimatedDiv fade scaleIn className="gradient-axel rounded-3xl p-8 text-white">
            <p className="text-5xl font-bold mb-2">50K+</p>
            <p className="text-white/70">Produits disponibles</p>
            <p className="text-5xl font-bold mt-6 mb-2">2M+</p>
            <p className="text-white/70">Clients satisfaits</p>
          </AnimatedDiv>
        </div>

        <div className="mb-20">
          <AnimatedDiv fade slideUp className="text-center mb-12">
            <h2 className="text-4xl font-bold text-[var(--text-primary)]">Nos valeurs</h2>
          </AnimatedDiv>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {values.map((v, i) => {
              const Icon = v.icon
              return (
                <AnimatedDiv key={v.title} fade slideUp delay={i * 0.05} className="p-6 rounded-2xl border-2 border-[var(--border)] hover:border-[var(--border-hover)]/30 transition-all hover:shadow-axel-lg">
                  <div className="w-12 h-12 rounded-xl bg-[var(--text-link)]/10 flex items-center justify-center mb-4"><Icon className="w-6 h-6 text-[var(--text-link)]" /></div>
                  <h3 className="font-bold text-[var(--text-primary)] mb-2">{v.title}</h3>
                  <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{v.desc}</p>
                </AnimatedDiv>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

"use client"

import { CreditCard, Calculator, CheckCircle, Clock, Shield } from "lucide-react"
import Button from "@/components/ui/button"
import CreditSimulator from "@/components/product/credit-simulator"
import type { Product } from "@/data/products"
import { hasCreditRates } from "@/data/products"
import { AnimatedDiv } from "@/lib/animations"
import { useCart } from "@/lib/cart-context"
import Link from "next/link"

const steps = [
  { icon: CreditCard, title: "Choisissez", desc: "Sélectionnez le produit qui vous fait envie" },
  { icon: Calculator, title: "Simulez", desc: "Choisissez votre durée de 3 à 36 mois" },
  { icon: CheckCircle, title: "Garants", desc: "Ajoutez 2 garants avec pièces d'identité" },
  { icon: Clock, title: "Recevez", desc: "Votre produit livré sous 48h après validation" },
]

const faqs = [
  { q: "Qui peut bénéficier d'un crédit ?", a: "Toute personne majeure avec une pièce d'identité valide et des revenus réguliers." },
  { q: "Quel est le taux d'intérÃªt ?", a: "De 0% à 8% selon la durée choisie. Simulation gratuite et sans engagement." },
  { q: "Quels sont les garants ?", a: "Vous devez fournir 2 garants avec leurs noms, téléphones, adresses et pièces d'identité valides (CNI, Passeport ou Permis)." },
  { q: "Quels documents fournir ?", a: "Pièce d'identité, justificatif de domicile, justificatif de revenus et 2 garants avec pièces d'identité." },
  { q: "Quel est le délai de réponse ?", a: "Votre demande est traitée sous 24 à 48h après soumission complète des documents." },
]

export default function ACreditPageContent({ products }: { products: Product[] }) {
  const { addItem } = useCart()

  function scrollTo(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" })
  }

  return (
    <div className="w-full min-h-screen bg-[var(--bg-primary)]">
      <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AnimatedDiv fade slideUp className="gradient-axel rounded-3xl p-8 sm:p-12 text-white text-center mb-16">
          <h1 className="text-4xl sm:text-5xl font-bold mb-4">Achetez à crédit</h1>
          <p className="text-white/70 text-lg max-w-xl mx-auto mb-6">Payez en mensualités adaptées à votre budget. Sans apport, sans stress.</p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Button variant="secondary" size="lg" className="bg-[var(--bg-primary)] text-[var(--text-primary)]" onClick={() => scrollTo("simulateur")}>Simuler mon crédit</Button>
            <Button variant="outline" size="lg" className="border-white/20 text-white hover:bg-white/10" onClick={() => scrollTo("comment")}>Comment ça marche</Button>
          </div>
        </AnimatedDiv>

        <div id="comment" className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16 scroll-mt-24">
          {steps.map((s, i) => {
            const Icon = s.icon
            return (
              <AnimatedDiv key={s.title} fade slideUp delay={i * 0.1} className="text-center p-6 rounded-2xl border-2 border-[var(--border)] hover:border-[var(--border-hover)]/20 transition-all">
                <div className="w-14 h-14 rounded-2xl gradient-axel flex items-center justify-center mx-auto mb-4"><Icon className="w-7 h-7 text-white" /></div>
                <h3 className="font-bold text-[var(--text-primary)] mb-1">{s.title}</h3>
                <p className="text-sm text-[var(--text-secondary)]">{s.desc}</p>
              </AnimatedDiv>
            )
          })}
        </div>

        <AnimatedDiv id="simulateur" fade slideUp className="mb-16 scroll-mt-24">
          <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-6">Simulez votre crédit</h2>
          <div className="max-w-md mx-auto">
            <CreditSimulator price={500000} productName="un produit AXEL" />
          </div>
        </AnimatedDiv>

        <AnimatedDiv fade slideUp className="mb-16">
          <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-6">Produits populaires à crédit</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.filter(p => hasCreditRates(p.creditRates)).slice(0, 4).map((product, i) => (
              <AnimatedDiv key={product.id} fade slideUp delay={i * 0.05} className="group bg-[var(--bg-primary)] rounded-2xl border-2 border-[var(--border)] hover:border-transparent hover:shadow-axel-xl transition-all duration-500 hover:-translate-y-2 overflow-hidden">
                <Link href={`/produit/${product.slug}`} className="relative aspect-square bg-[var(--bg-secondary)] overflow-hidden block">
                  <img src={product.image} alt={product.name} className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-700" />
                </Link>
                <div className="p-4">
                  <p className="text-xs text-[var(--text-link)] font-semibold">{product.brand}</p>
                  <Link href={`/produit/${product.slug}`}><h3 className="font-semibold text-[var(--text-primary)] text-sm">{product.name}</h3></Link>
                  <p className="text-lg font-bold text-[var(--text-primary)] mt-1">{product.price.toLocaleString("fr-FR")} F</p>
                  <p className="text-xs text-[var(--text-link)] font-semibold">À partir de {product.monthlyPrice.toLocaleString("fr-FR")} F/mois</p>
                  <Button size="sm" className="w-full mt-3" onClick={() => addItem(product)}>Ajouter au panier</Button>
                </div>
              </AnimatedDiv>
            ))}
          </div>
        </AnimatedDiv>

        <AnimatedDiv fade slideUp className="rounded-2xl border-2 border-[var(--border)] p-6 sm:p-8">
          <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-6">Questions sur le crédit</h2>
          <div className="grid sm:grid-cols-2 gap-6">
            {faqs.map((item, i) => (
              <div key={i} className="p-4 rounded-xl bg-[var(--bg-secondary)]">
                <h3 className="font-semibold text-[var(--text-primary)] text-sm mb-1">{item.q}</h3>
                <p className="text-xs text-[var(--text-secondary)]">{item.a}</p>
              </div>
            ))}
          </div>
        </AnimatedDiv>
      </div>
    </div>
  )
}

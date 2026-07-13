"use client"

import { Store, ArrowLeft, Package } from "lucide-react"
import Button from "@/components/ui/button"
import { AnimatedDiv } from "@/lib/animations"
import Link from "next/link"

export default function SellerProductsPage() {
  return (
    <div className="w-full min-h-screen bg-[var(--bg-secondary)]">
      <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/vendeur" className="p-2 rounded-xl bg-[var(--bg-primary)] hover:bg-[var(--bg-secondary)] transition-colors">
            <ArrowLeft className="w-5 h-5 text-[var(--text-secondary)]" />
          </Link>
          <h1 className="text-4xl font-bold text-[var(--text-primary)]">Gestion des produits</h1>
        </div>

        <AnimatedDiv fade slideUp className="max-w-lg mx-auto text-center py-12">
          <div className="w-20 h-20 rounded-3xl bg-[var(--text-link)]/10 flex items-center justify-center mx-auto mb-6">
            <Store className="w-10 h-10 text-[var(--text-link)]" />
          </div>
          <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-3">
            Gérez vos produits depuis votre boutique
          </h2>
          <p className="text-[var(--text-secondary)] mb-8 leading-relaxed">
            Les produits sont désormais gérés directement depuis votre espace boutique. 
            C'est plus simple et plus rapide !
          </p>
          <Link href="/vendeur/boutique">
            <Button size="lg">
              <Store className="w-4 h-4" /> Accéder à ma boutique
            </Button>
          </Link>
        </AnimatedDiv>
      </div>
    </div>
  )
}

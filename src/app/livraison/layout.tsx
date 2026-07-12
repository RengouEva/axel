import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Suivi de livraison",
  description: "Suivez vos colis livrés par AXEL en temps réel. Service de livraison rapide et sécurisé dans toute l'Afrique.",
  openGraph: {
    title: "Suivi de livraison | AXEL Marketplace",
    description: "Suivez vos colis en temps réel.",
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}

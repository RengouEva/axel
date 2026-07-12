import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Acheter à crédit",
  description: "Achetez vos produits maintenant et payez en mensualités avec AXEL Crédit. Simulation immédiate, taux à partir de 0%. Faites vos achats à crédit en toute simplicité.",
  openGraph: {
    title: "Acheter à crédit | AXEL Marketplace",
    description: "Payez en plusieurs mensualités sans attendre. Simulation gratuite et immédiate.",
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}

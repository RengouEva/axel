import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Tous nos produits",
  description: "Découvrez notre catalogue complet de produits high-tech, électroménager, mode et plus sur AXEL Marketplace. Paiement comptant ou à crédit.",
  openGraph: {
    title: "Tous nos produits | AXEL Marketplace",
    description: "Des milliers de produits aux meilleurs prix. Payez comptant ou à crédit.",
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}

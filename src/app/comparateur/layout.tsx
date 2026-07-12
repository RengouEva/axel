import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Comparateur de produits",
  description: "Comparez les prix et caractéristiques des produits sur AXEL Marketplace. Trouvez le meilleur rapport qualité-prix.",
  openGraph: {
    title: "Comparateur | AXEL Marketplace",
    description: "Comparez et économisez sur vos achats.",
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}

import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "À propos",
  description: "AXEL Marketplace est la marketplace qui rend vos achats accessibles, simples et sécurisés en Afrique. Paiement comptant ou à crédit.",
  openGraph: {
    title: "À propos | AXEL Marketplace",
    description: "Notre mission : rendre le shopping accessible à tous.",
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}

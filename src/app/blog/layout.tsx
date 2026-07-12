import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Blog",
  description: "Actualités, guides d'achat et conseils sur AXEL Marketplace. Suivez nos articles pour rester informé des dernières tendances.",
  openGraph: {
    title: "Blog | AXEL Marketplace",
    description: "Actualités, guides et conseils.",
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}

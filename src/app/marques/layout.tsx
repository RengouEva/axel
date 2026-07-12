import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Marques",
  description: "Découvrez toutes les marques disponibles sur AXEL Marketplace.",
  openGraph: {
    title: "Marques | AXEL Marketplace",
    description: "Les plus grandes marques réunies.",
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}

import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Nouveautés",
  description: "Découvrez les derniers produits ajoutés sur AXEL Marketplace. Restez à la pointe de la technologie avec nos nouveautés.",
  openGraph: {
    title: "Nouveautés | AXEL Marketplace",
    description: "Les derniers produits viennent d'arriver !",
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}

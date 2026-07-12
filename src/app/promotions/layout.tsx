import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Promotions",
  description: "Profitez de nos meilleures offres et promotions sur AXEL Marketplace. Des réductions exclusives sur les produits high-tech, électroménager et plus.",
  openGraph: {
    title: "Promotions | AXEL Marketplace",
    description: "Nos meilleures offres du moment. Ne les manquez pas !",
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}

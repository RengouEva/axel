import type { Metadata } from "next"
import { getCategoryBySlug } from "@/data/categories"
import { BreadcrumbSchema } from "@/lib/seo"

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://axel.marketplace"

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const category = await getCategoryBySlug(slug)
  if (!category) return { title: "Catégorie" }

  return {
    title: category.name,
    description: `Découvrez notre sélection de ${category.name.toLowerCase()} sur AXEL Marketplace. Paiement comptant ou à crédit.`,
    alternates: { canonical: `${SITE_URL}/categorie/${category.slug}` },
    openGraph: {
      title: category.name,
      description: `Retrouvez tous nos produits ${category.name.toLowerCase()} sur AXEL Marketplace`,
    },
  }
}

export default async function Layout({ children, params }: { children: React.ReactNode; params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const category = await getCategoryBySlug(slug)

  return (
    <>
      {category && (
        <BreadcrumbSchema items={[
          { name: "Accueil", url: "/" },
          { name: category.name, url: `/categorie/${category.slug}` },
        ]} />
      )}
      {children}
    </>
  )
}

import type { Metadata } from "next"
import { getProductBySlug } from "@/data/products"
import { ProductSchema, BreadcrumbSchema } from "@/lib/seo"

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://axel.marketplace"

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const product = await getProductBySlug(slug)
  if (!product) return { title: "Produit" }

  return {
    title: `${product.name} - ${product.brand}`,
    description: `Achetez ${product.name} de ${product.brand} à ${product.price.toLocaleString("fr-FR")} F sur AXEL Marketplace. Paiement comptant ou à crédit dès ${product.monthlyPrice.toLocaleString("fr-FR")} F/mois. Livraison rapide.`,
    alternates: { canonical: `${SITE_URL}/produit/${product.slug}` },
    openGraph: {
      title: `${product.name} - ${product.brand}`,
      description: `Prix : ${product.price.toLocaleString("fr-FR")} F`,
      images: [{ url: product.image, width: 800, height: 600 }],
    },
  }
}

export default async function Layout({ children, params }: { children: React.ReactNode; params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const product = await getProductBySlug(slug)

  return (
    <>
      {product && (
        <>
          <ProductSchema product={product} />
          <BreadcrumbSchema items={[
            { name: "Accueil", url: "/" },
            { name: product.category, url: `/categorie/${product.category.toLowerCase()}` },
            { name: product.name, url: `/produit/${product.slug}` },
          ]} />
        </>
      )}
      {children}
    </>
  )
}

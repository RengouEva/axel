import { notFound } from "next/navigation"
import { getProductBySlug } from "@/data/products"
import ProductDetailClient from "./page-content"

export default async function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const product = await getProductBySlug(slug)
  if (!product) notFound()
  return <ProductDetailClient product={product} />
}

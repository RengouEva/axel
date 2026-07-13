import { notFound } from "next/navigation"
import { getRankedProductsByCategory, getProductsByCategory } from "@/data/products"
import { getCategoryBySlug } from "@/data/categories"
import CategoryPageContent from "./page-content"

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const category = await getCategoryBySlug(slug)
  if (!category) notFound()
  let products = [] as Awaited<ReturnType<typeof getProductsByCategory>>
  try {
    products = await getRankedProductsByCategory(category.name)
  } catch {
    products = await getProductsByCategory(category.name)
  }
  return <CategoryPageContent products={products} category={category} />
}

import { getRankedProducts, getProducts } from "@/data/products"
import { getCategories } from "@/data/categories"
import ProductsPageContent from "./page-content"

export default async function ProductsPage() {
  const [categories] = await Promise.all([getCategories()])
  let products = [] as Awaited<ReturnType<typeof getProducts>>
  try {
    const result = await getRankedProducts({ limit: 50 })
    products = result.products
  } catch {
    products = await getProducts()
  }
  return <ProductsPageContent products={products} categories={categories} />
}

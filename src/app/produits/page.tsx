import { getRankedProducts } from "@/data/products"
import { getCategories } from "@/data/categories"
import ProductsPageContent from "./page-content"

export default async function ProductsPage() {
  const [result, categories] = await Promise.all([
    getRankedProducts({ limit: 50 }),
    getCategories(),
  ])
  return <ProductsPageContent products={result.products} categories={categories} />
}

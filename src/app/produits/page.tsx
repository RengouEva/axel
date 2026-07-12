import { getProducts } from "@/data/products"
import { getCategories } from "@/data/categories"
import ProductsPageContent from "./page-content"

export default async function ProductsPage() {
  const [products, categories] = await Promise.all([
    getProducts(),
    getCategories(),
  ])
  return <ProductsPageContent products={products} categories={categories} />
}

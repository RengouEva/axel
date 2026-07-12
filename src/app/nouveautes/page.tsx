import { getNewProducts } from "@/data/products"
import NewProductsPageContent from "./page-content"

export default async function NouveautesPage() {
  const products = await getNewProducts(4)
  return <NewProductsPageContent products={products} />
}

import { getProducts } from "@/data/products"
import ACreditPageContent from "./page-content"

export default async function ACreditPage() {
  const products = await getProducts()
  return <ACreditPageContent products={products} />
}

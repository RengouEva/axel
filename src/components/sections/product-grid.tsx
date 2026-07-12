import { getProducts } from "@/data/products"
import ProductGridContent from "./product-grid-content"

export default async function ProductGrid() {
  const products = await getProducts()
  return <ProductGridContent products={products} />
}

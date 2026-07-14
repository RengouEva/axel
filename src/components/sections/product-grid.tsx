import ProductGridContent from "./product-grid-content"
import { getRankedProducts } from "@/data/products"

export default async function ProductGrid() {
  let products: unknown[] = []
  try {
    const result = await getRankedProducts({ limit: 8 })
    products = result.products
  } catch (e) {
    console.error("[ProductGrid] Erreur chargement produits:", e)
  }
  return <ProductGridContent products={products as never[]} />
}

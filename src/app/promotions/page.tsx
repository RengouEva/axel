import { getPromotedProducts } from "@/data/products"
import PromotionsPageContent from "./page-content"

export default async function PromotionsPage() {
  const products = await getPromotedProducts()
  return <PromotionsPageContent products={products} />
}

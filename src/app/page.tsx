import ProductGrid from "@/components/sections/product-grid"
import HomeClient from "./home-client"

export default function Home() {
  return (
    <HomeClient productGrid={<ProductGrid />} />
  )
}

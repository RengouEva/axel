import ProductGridContent from "./product-grid-content"

export default async function ProductGrid() {
  let products: unknown[] = []
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
    const res = await fetch(`${baseUrl}/api/products?limit=8`, { cache: "no-store" })
    const data = await res.json()
    products = Array.isArray(data?.products) ? data.products : []
  } catch {}
  return <ProductGridContent products={products as never[]} />
}

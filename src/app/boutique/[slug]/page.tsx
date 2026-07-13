import { notFound } from "next/navigation"
import { getRankedProductsByShop, getProductsByShop } from "@/data/products"
import { getShopBySlug } from "@/data/shops"
import { getCountries, getCities, getDistricts } from "@/data/delivery"
import BoutiquePageContent from "./page-content"

export default async function BoutiquePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const shop = await getShopBySlug(slug)
  if (!shop) notFound()
  let products = [] as Awaited<ReturnType<typeof getProductsByShop>>
  try {
    products = await getRankedProductsByShop(slug)
  } catch {
    products = await getProductsByShop(slug)
  }
  const [countries, cities, districts] = await Promise.all([
    getCountries(),
    getCities(),
    getDistricts(),
  ])
  return <BoutiquePageContent products={products} shop={shop} countries={countries} cities={cities} districts={districts} />
}

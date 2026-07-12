import { notFound } from "next/navigation"
import { getProductsByShop } from "@/data/products"
import { getShopBySlug } from "@/data/shops"
import { getCountries, getCities, getDistricts } from "@/data/delivery"
import BoutiquePageContent from "./page-content"

export default async function BoutiquePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const shop = await getShopBySlug(slug)
  if (!shop) notFound()
  const [products, countries, cities, districts] = await Promise.all([
    getProductsByShop(slug),
    getCountries(),
    getCities(),
    getDistricts(),
  ])
  return <BoutiquePageContent products={products} shop={shop} countries={countries} cities={cities} districts={districts} />
}

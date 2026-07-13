export interface Product {
  id: number
  name: string
  brand: string
  category: string
  price: number
  monthlyPrice: number
  rating: number
  reviews: number
  inStock: boolean
  promotion: boolean
  image: string
  images: string[]
  slug: string
  creditRates?: string
  description?: string
  shopId?: string
  shop?: { id: string; name: string; slug: string; logo: string; category: string; badges?: { type: string; label: string; color: string; icon?: string }[] }
  badges?: { type: string; label: string; color: string; icon?: string }[]
  boosted?: boolean
}

export function hasCreditRates(creditRates?: string): boolean {
  if (!creditRates) return false
  try {
    return Object.values(JSON.parse(creditRates)).some(v => Number(v) > 0)
  } catch {
    return false
  }
}

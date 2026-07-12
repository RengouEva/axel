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

export interface Category {
  id: number
  name: string
  slug: string
  icon: string
}

export interface Shop {
  id: string
  sellerId: number
  name: string
  slug: string
  description: string
  phone: string
  email: string
  logo: string
  coverImage: string
  countryId: string
  cityId: string
  districtId: string
  address: string
  category: string
  rating: number
  totalSales: number
  createdAt: Date
  badges?: { type: string; label: string; color: string; icon?: string }[]
}

export interface Country { id: string; name: string; flag: string }
export interface City { id: string; name: string; countryId: string; x: number; y: number }
export interface District { id: string; name: string; cityId: string; x: number; y: number }
export interface TaxRate { id: number; countryId: string; rate: number; label: string }

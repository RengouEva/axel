export type CampaignType = "sponsored_product" | "sponsored_shop" | "banner" | "event"
export type CampaignStatus = "draft" | "pending" | "active" | "paused" | "completed" | "cancelled" | "rejected"
export type CampaignObjective = "visibility" | "traffic" | "conversions" | "sales"
export type AdSlot =
  | "HOME_HERO" | "HOME_FEATURED" | "HOME_INLINE"
  | "SEARCH_TOP" | "SEARCH_INLINE" | "SEARCH_BOTTOM"
  | "CATEGORY_TOP" | "CATEGORY_INLINE" | "CATEGORY_BOTTOM"
  | "PRODUCT_SIMILAR" | "PRODUCT_SELLER" | "PRODUCT_RECOMMENDED"
  | "SHOP_TOP" | "SHOP_PRODUCTS"
  | "MOBILE_FEED" | "MOBILE_CAROUSEL" | "MOBILE_BANNER"
export type PaymentMethod = "irispay" | "orange_money" | "mtn_mobile_money" | "card" | "other"

export interface AdCampaign {
  id: string
  shopId: string
  userId: number
  name: string
  type: CampaignType
  objective: string
  status: CampaignStatus
  budget: number
  spent: number
  startDate: string
  endDate: string
  dailyBudget: number
  targetCountry: string | null
  targetCity: string | null
  targetDistrict: string | null
  targetCategory: string | null
  productId: number | null
  bannerImage: string | null
  bannerUrl: string | null
  impressions: number
  clicks: number
  ctr: number
  avgCpc: number
  avgCpm: number
  cartAdds: number
  sales: number
  conversionRate: number
  roi: number
  qualityScore: number
  approvedAt: string | null
  createdAt: string
  placements?: { id: string; slot: AdSlot; bid: number }[]
  product?: { id: number; name: string; image: string; price: number }
  shop?: { id: string; name: string; slug: string; logo: string }
}

export interface AdPlacement {
  id: string
  slot: AdSlot
  name: string
  description: string
  basePrice: number
  auctionEnabled: boolean
  isActive: boolean
}

export interface AdServingAd {
  id: string
  type: CampaignType
  product: { id: number; name: string; image: string; price: number } | null
  shop: { id: string; name: string; slug: string; logo: string } | null
  bannerImage: string | null
  bannerUrl: string | null
  targetUrl: string
  placementId: string
  sessionId: string
}

export interface AiRecommendation {
  recommendedBudget: { min: number; max: number; optimal: number }
  recommendedPlacements: { slot: AdSlot; score: number; reason: string }[]
  predictedPerformance: { estimatedImpressions: number; estimatedClicks: number; estimatedCtr: string; estimatedCpc: number }
  bestHours: string[]
  confidence: number
}

export interface FraudCheckResult {
  isFraudulent: boolean
  score: number
  reasons: string[]
}

export interface AdStatsOverview {
  totalCampaigns: number
  activeCampaigns: number
  totalImpressions: number
  totalClicks: number
  totalSpent: number
  totalBudget: number
  totalSales: number
  totalCartAdds: number
  ctr: string
  spendRate: string
}

export interface CampaignPerformance {
  dailyImpressions: { date: string; count: number }[]
  dailyClicks: { date: string; count: number }[]
  dailyEvents: { date: string; type: string; count: number }[]
}

export const AD_SLOT_LABELS: Record<string, string> = {
  HOME_HERO: "Bandeau Hero",
  HOME_FEATURED: "À la Une - Accueil",
  HOME_INLINE: "Insertion Accueil",
  SEARCH_TOP: "Haut de Recherche",
  SEARCH_INLINE: "Dans la Recherche",
  SEARCH_BOTTOM: "Bas de Recherche",
  CATEGORY_TOP: "Bannière Catégorie",
  CATEGORY_INLINE: "Dans Catégorie",
  CATEGORY_BOTTOM: "Bas de Catégorie",
  PRODUCT_SIMILAR: "Produits Similaires",
  PRODUCT_SELLER: "Autres du Vendeur",
  PRODUCT_RECOMMENDED: "Recommandés",
  SHOP_TOP: "Boutique Sponsorisée",
  SHOP_PRODUCTS: "Dans la Boutique",
  MOBILE_FEED: "Fil Mobile",
  MOBILE_CAROUSEL: "Carrousel Mobile",
  MOBILE_BANNER: "Bannière Mobile",
}

export const CAMPAIGN_TYPE_LABELS: Record<CampaignType, string> = {
  sponsored_product: "Produit sponsorisé",
  sponsored_shop: "Boutique sponsorisée",
  banner: "Bannière sponsorisée",
  event: "Campagne événementielle",
}

export const STATUS_LABELS: Record<CampaignStatus, string> = {
  draft: "Brouillon",
  pending: "En attente",
  active: "Active",
  paused: "En pause",
  completed: "Terminée",
  cancelled: "Annulée",
  rejected: "Refusée",
}

export const STATUS_COLORS: Record<CampaignStatus, string> = {
  draft: "text-[var(--text-muted)] bg-white/5",
  pending: "text-amber-400 bg-amber-500/10",
  active: "text-green-400 bg-green-500/10",
  paused: "text-blue-400 bg-blue-500/10",
  completed: "text-[var(--text-secondary)] bg-white/5",
  cancelled: "text-red-400 bg-red-500/10",
  rejected: "text-red-400 bg-red-500/10",
}

export const BOOSTER_EXPRESS_OPTIONS = [
  { days: 1, price: 500, label: "24 heures" },
  { days: 3, price: 1200, label: "3 jours" },
  { days: 7, price: 2000, label: "7 jours" },
  { days: 15, price: 3500, label: "15 jours" },
  { days: 30, price: 5000, label: "30 jours" },
]

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  irispay: "IrisPay",
  orange_money: "Orange Money",
  mtn_mobile_money: "MTN Mobile Money",
  card: "Carte bancaire",
  other: "Autre",
}

export const SLOT_DIMENSIONS: Record<string, { width: number; height: number; label: string }> = {
  HOME_HERO: { width: 1200, height: 200, label: "1200 × 200" },
  HOME_FEATURED: { width: 300, height: 300, label: "300 × 300" },
  HOME_INLINE: { width: 300, height: 300, label: "300 × 300" },
  SEARCH_TOP: { width: 728, height: 90, label: "728 × 90" },
  SEARCH_INLINE: { width: 300, height: 300, label: "300 × 300" },
  SEARCH_BOTTOM: { width: 300, height: 300, label: "300 × 300" },
  CATEGORY_TOP: { width: 728, height: 90, label: "728 × 90" },
  CATEGORY_INLINE: { width: 300, height: 300, label: "300 × 300" },
  CATEGORY_BOTTOM: { width: 300, height: 300, label: "300 × 300" },
  PRODUCT_SIMILAR: { width: 300, height: 300, label: "300 × 300" },
  PRODUCT_SELLER: { width: 300, height: 300, label: "300 × 300" },
  PRODUCT_RECOMMENDED: { width: 300, height: 300, label: "300 × 300" },
  SHOP_TOP: { width: 300, height: 300, label: "300 × 300" },
  SHOP_PRODUCTS: { width: 300, height: 300, label: "300 × 300" },
  MOBILE_FEED: { width: 300, height: 250, label: "300 × 250" },
  MOBILE_CAROUSEL: { width: 300, height: 200, label: "300 × 200" },
  MOBILE_BANNER: { width: 320, height: 100, label: "320 × 100" },
}

function generateId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`
}

export { generateId }

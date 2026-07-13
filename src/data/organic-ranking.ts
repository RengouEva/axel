import { queryOne, queryAll, execute } from "@/lib/db"
import { cached, getCached, setCache } from "@/lib/cache"
import type { Product } from "./product-types"

export interface OrganicScore {
  productId: number
  relevance: number
  quality: number
  freshness: number
  availability: number
  price: number
  sellerReputation: number
  performance: number
  activity: number
  userExperience: number
  total: number
  details?: Record<string, number>
}

export interface UserContext {
  userId?: number
  countryId?: string
  cityId?: string
  districtId?: string
  language?: string
  viewedCategories?: string[]
  searchHistory?: string[]
  favorites?: number[]
}

export interface SearchContext {
  query?: string
  category?: string
  brand?: string
  model?: string
  keywords?: string[]
}

const WEIGHTS = {
  relevance: 1.0,
  quality: 1.0,
  freshness: 1.0,
  availability: 1.0,
  price: 0.8,
  sellerReputation: 1.0,
  performance: 1.0,
  activity: 1.0,
  userExperience: 1.0,
}

const SCORE_CACHE_TTL = 300_000
const ROTATION_THRESHOLD = 5
const ROTATION_SEED_INTERVAL = 3600_000

export async function getProductWithShop(productId: number): Promise<any> {
  return queryOne<any>(
    `SELECT p.*, s.id as shop_id, s.name as shop_name, s.slug as shop_slug,
            s.logo as shop_logo, s.category as shop_category,
            s.rating as shop_rating, s.reviews as shop_reviews,
            s.totalSales as shop_totalSales, s.createdAt as shop_createdAt,
            s.sellerVerified as shop_sellerVerified
     FROM Product p
     LEFT JOIN Shop s ON s.id = p.shopId
     WHERE p.id = ?`,
    [productId]
  )
}

export function calculateRelevanceScore(product: any, search?: SearchContext): number {
  let score = 0
  const query = search?.query?.toLowerCase().trim() || ""

  if (!query && !search?.category && !search?.brand) return 50

  if (query) {
    if (product.name?.toLowerCase().includes(query)) score += 30
    if (product.description?.toLowerCase().includes(query)) score += 20
    if (product.brand?.toLowerCase().includes(query)) score += 15
    if (product.name?.toLowerCase().split(" ").some((w: string) => w.startsWith(query))) score += 10
  }

  if (search?.category && product.category === search.category) score += 25

  if (search?.brand && product.brand?.toLowerCase() === search.brand.toLowerCase()) score += 15

  if (search?.model && product.name?.toLowerCase().includes(search.model.toLowerCase())) score += 10

  if (search?.keywords) {
    const matchedKeywords = search.keywords.filter(k =>
      product.name?.toLowerCase().includes(k.toLowerCase()) ||
      product.description?.toLowerCase().includes(k.toLowerCase()) ||
      product.brand?.toLowerCase().includes(k.toLowerCase())
    ).length
    score += Math.min(matchedKeywords * 5, 20)
  }

  return Math.min(score, 100)
}

export function calculateQualityScore(product: any): number {
  let score = 0

  const images: string[] = (() => {
    if (!product.images) return []
    if (Array.isArray(product.images)) return product.images
    try { return JSON.parse(product.images) } catch { return [] }
  })()

  if (images.length > 0) score += 20
  if (images.length >= 3) score += 10
  if (images.length >= 5) score += 5

  const mainImage = product.image || images[0] || ""
  if (mainImage && !mainImage.includes("default") && !mainImage.includes("visuel")) score += 15

  if (product.description) {
    const len = product.description.length
    if (len > 1000) score += 20
    else if (len > 500) score += 15
    else if (len > 200) score += 10
    else if (len > 50) score += 5
  }

  if (product.hasVideo) score += 15

  if (product.hasFeatures || product.specs) score += 10

  if (product.technicalInfo || product.hasTechnicalInfo) score += 10

  return Math.min(score, 100)
}

export function calculateFreshnessScore(createdAt: string, updatedAt?: string): number {
  const targetDate = updatedAt || createdAt
  const target = new Date(targetDate)
  const now = new Date()
  const hoursDiff = Math.floor((now.getTime() - target.getTime()) / (1000 * 60 * 60))

  if (hoursDiff <= 1) return 100
  if (hoursDiff <= 6) return 95
  if (hoursDiff <= 24) return 85
  if (hoursDiff <= 72) return 70
  if (hoursDiff <= 168) return 55

  const daysDiff = Math.floor(hoursDiff / 24)
  if (daysDiff <= 30) return 40
  if (daysDiff <= 90) return 25

  if (updatedAt && updatedAt !== createdAt) {
    const updateDays = Math.floor((now.getTime() - new Date(updatedAt).getTime()) / (1000 * 60 * 60 * 24))
    if (updateDays <= 7) return 45
    if (updateDays <= 30) return 30
  }

  return Math.max(5, 100 - daysDiff * 1.5)
}

export function calculateAvailabilityScore(inStock: boolean | number, quantity?: number): number {
  if (!inStock) return 0
  if (quantity !== undefined && quantity <= 0) return 0
  if (quantity !== undefined && quantity < 3) return 50
  if (quantity !== undefined && quantity < 10) return 80
  return 100
}

export function calculatePriceScore(price: number, category?: string): number {
  const categoryRanges: Record<string, { optimal: number; max: number }> = {
    "Téléphones": { optimal: 150000, max: 1500000 },
    "Ordinateurs": { optimal: 350000, max: 2000000 },
    "TV & Audio": { optimal: 200000, max: 1500000 },
    "Électroménager": { optimal: 150000, max: 1000000 },
    "Mode": { optimal: 25000, max: 200000 },
    "Beauté": { optimal: 15000, max: 150000 },
    "Maison": { optimal: 50000, max: 500000 },
    "Sport": { optimal: 50000, max: 500000 },
    "Auto-Moto": { optimal: 500000, max: 15000000 },
    "Immobilier": { optimal: 5000000, max: 100000000 },
    "Services": { optimal: 50000, max: 500000 },
  }

  const range = category ? categoryRanges[category] : null
  const optimalPrice = range?.optimal || 5000
  const maxPrice = range?.max || 50000

  if (price <= 0) return 0
  if (price > maxPrice * 3) return Math.max(0, 30 - (price / maxPrice) * 10)
  if (price > maxPrice) return Math.max(20, 50 - ((price - maxPrice) / maxPrice) * 30)

  const deviation = Math.abs(price - optimalPrice) / optimalPrice
  if (deviation <= 0.2) return 100
  if (deviation <= 0.5) return 80
  if (deviation <= 1.0) return 60
  if (deviation <= 2.0) return 40

  return 20
}

export async function calculateSellerReputationScore(shopId: string): Promise<number> {
  const cacheKey = `seller_rep:${shopId}`
  const cached = getCached<number>(cacheKey)
  if (cached !== undefined) return cached

  const shop = await queryOne<any>(
    `SELECT s.rating, s.reviews, s.totalSales, s.sellerVerified, s.createdAt,
            COUNT(DISTINCT p.id) as productCount,
            COUNT(DISTINCT CASE WHEN p.updatedAt > DATE_SUB(NOW(), INTERVAL 30 DAY) THEN p.id END) as activeProducts,
            COUNT(DISTINCT sb.id) as badgeCount
     FROM Shop s
     LEFT JOIN Product p ON p.shopId = s.id
     LEFT JOIN ShopBadge sb ON sb.shopId = s.id AND sb.expiresAt IS NULL
     WHERE s.id = ?
     GROUP BY s.id`,
    [shopId]
  )

  if (!shop) return 0

  let score = 0

  score += Math.min((shop.rating || 0) * 15, 30)

  score += Math.min((shop.reviews || 0) * 0.5, 15)

  const satisfactionRate = shop.reviews > 0 ? (shop.rating / 5) : 0.5
  score += satisfactionRate * 10

  if (shop.createdAt) {
    const accountAgeDays = Math.floor((new Date().getTime() - new Date(shop.createdAt).getTime()) / (1000 * 60 * 60 * 24))
    score += Math.min(accountAgeDays * 0.5, 15)
  }

  if (shop.sellerVerified) score += 15

  score += Math.min((shop.totalSales || 0) * 0.2, 15)

  score += Math.min((shop.productCount || 0) * 0.5, 10)
  score += Math.min((shop.activeProducts || 0) * 1.5, 10)

  score += Math.min((shop.badgeCount || 0) * 10, 20)

  const result = Math.min(score, 100)
  setCache(cacheKey, result, SCORE_CACHE_TTL)
  return result
}

export async function calculatePerformanceScore(productId: number): Promise<number> {
  const cacheKey = `perf:${productId}`
  const cached = getCached<number>(cacheKey)
  if (cached !== undefined) return cached

  const stats = await queryOne<any>(
    `SELECT
       COALESCE(SUM(CASE WHEN event = 'view' AND createdAt > DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 ELSE 0 END), 0) as views30,
       COALESCE(SUM(CASE WHEN event = 'click' AND createdAt > DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 ELSE 0 END), 0) as clicks30,
       COALESCE(SUM(CASE WHEN event = 'favorite' AND createdAt > DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 ELSE 0 END), 0) as favorites30,
       COALESCE(SUM(CASE WHEN event = 'cart_add' AND createdAt > DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 ELSE 0 END), 0) as cartAdds30,
       COALESCE(SUM(CASE WHEN event = 'purchase' AND createdAt > DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 ELSE 0 END), 0) as purchases30
     FROM ProductEvent
     WHERE productId = ?`,
    [productId]
  )

  if (!stats) return 0

  let score = 0

  const { views30, clicks30, favorites30, cartAdds30, purchases30 } = stats

  score += Math.min(views30 * 0.3, 10)
  score += Math.min(clicks30 * 2.0, 15)
  score += Math.min(favorites30 * 1.5, 15)
  score += Math.min(cartAdds30 * 2.5, 20)
  score += Math.min(purchases30 * 5.0, 25)

  if (views30 > 0) {
    const ctr = (clicks30 / views30) * 100
    score += Math.min(ctr * 0.5, 10)
    const conversionRate = (purchases30 / views30) * 100
    score += Math.min(conversionRate * 2.0, 15)
  }

  if (views30 > 0 && favorites30 > 0) {
    const favRate = (favorites30 / views30) * 100
    if (favRate > 5) score += 5
  }

  const result = Math.min(score, 100)
  setCache(cacheKey, result, SCORE_CACHE_TTL)
  return result
}

export async function calculateActivityScore(productId: number, shopId?: string): Promise<number> {
  let score = 0

  const productActivity = await queryOne<any>(
    `SELECT updatedAt, createdAt FROM Product WHERE id = ?`,
    [productId]
  )

  if (!productActivity) return 0

  const updateRecency = Math.floor((new Date().getTime() - new Date(productActivity.updatedAt || productActivity.createdAt).getTime()) / (1000 * 60 * 60 * 24))
  if (updateRecency <= 1) score += 25
  else if (updateRecency <= 7) score += 20
  else if (updateRecency <= 30) score += 15
  else if (updateRecency <= 90) score += 5

  if (shopId) {
    const sellerActivity = await queryOne<any>(
      `SELECT
         COALESCE(AVG(responseTime), 0) as avgResponseTime,
         COALESCE(cancellationRate, 0) as cancellationRate,
         COALESCE(availability, 1.0) as availability
       FROM SellerActivity WHERE shopId = ?`,
      [shopId]
    )

    if (sellerActivity) {
      if (sellerActivity.avgResponseTime <= 3600) score += 20
      else if (sellerActivity.avgResponseTime <= 14400) score += 15
      else if (sellerActivity.avgResponseTime <= 86400) score += 10

      if (sellerActivity.cancellationRate <= 0.02) score += 20
      else if (sellerActivity.cancellationRate <= 0.05) score += 15
      else if (sellerActivity.cancellationRate <= 0.10) score += 10
      else score -= 15

      if (sellerActivity.availability >= 0.95) score += 20
      else if (sellerActivity.availability >= 0.85) score += 15
      else if (sellerActivity.availability >= 0.70) score += 10
      else score -= 10
    }

    const ordersLast30 = await queryOne<{ count: number }>(
      `SELECT COUNT(*) as count FROM OrderItem oi
       JOIN Product p ON p.id = oi.productId
       WHERE p.shopId = ? AND oi.createdAt > DATE_SUB(NOW(), INTERVAL 30 DAY)`,
      [shopId]
    )
    if (ordersLast30 && ordersLast30.count > 0) {
      score += Math.min(ordersLast30.count * 2, 15)
    }
  }

  return Math.min(score, 100)
}

export function calculateUserExperienceScore(product: any): number {
  let score = 50

  if (product.isDuplicate) score -= 40
  if (product.isSpam) score -= 50
  if (product.hasCopiedContent) score -= 30
  if (product.hasInaccurateInfo) score -= 25
  if (product.hasMisleadingContent) score -= 45

  const images: string[] = (() => {
    if (!product.images) return []
    if (Array.isArray(product.images)) return product.images
    try { return JSON.parse(product.images) } catch { return [] }
  })()

  if (images.length === 0 || !product.image || product.image.includes("default")) score -= 15

  if (product.description && product.description.length < 20) score -= 10

  if (product.price <= 0) score -= 20

  if (product.name && product.name.length < 5) score -= 5

  if (product.isVerifiedListing) score += 15
  if (product.hasAuthenticPhotos) score += 10

  return Math.max(0, Math.min(score, 100))
}

export async function checkFraud(productId: number): Promise<{ isFraudulent: boolean; score: number; reasons: string[] }> {
  const reasons: string[] = []
  let fraudScore = 0

  const product = await queryOne<any>(`SELECT * FROM Product WHERE id = ?`, [productId])
  if (!product) return { isFraudulent: true, score: 100, reasons: ["Produit introuvable"] }

  const duplicates = await queryOne<{ count: number }>(
    `SELECT COUNT(*) as count FROM Product WHERE name = ? AND id != ?`,
    [product.name, productId]
  )
  if (duplicates && duplicates.count >= 3) {
    fraudScore += 30
    reasons.push(`Annonce dupliquée ${duplicates.count} fois`)
  }

  if (product.price <= 0 || product.price > 100000000) {
    fraudScore += 20
    reasons.push("Prix anormal")
  }

  if (product.name && product.name.length > 200) {
    fraudScore += 15
    reasons.push("Titre anormalement long (bourrage de mots-clés)")
  }

  const recentEvents = await queryOne<{ count: number }>(
    `SELECT COUNT(*) as count FROM ProductEvent
     WHERE productId = ? AND createdAt > DATE_SUB(NOW(), INTERVAL 1 HOUR)`,
    [productId]
  )

  if (recentEvents && recentEvents.count > 100) {
    fraudScore += 25
    reasons.push("Activité anormalement élevée (clics suspects)")
  }

  const shopProducts = await queryAll<any>(
    `SELECT id, name FROM Product WHERE shopId = (SELECT shopId FROM Product WHERE id = ?) AND id != ?`,
    [productId, productId]
  )

  if (shopProducts.length > 20) {
    const similarNames = shopProducts.filter(p =>
      p.name && product.name && (
        p.name.toLowerCase().includes(product.name.toLowerCase()) ||
        product.name.toLowerCase().includes(p.name.toLowerCase())
      )
    )
    if (similarNames.length > 5) {
      fraudScore += 20
      reasons.push("Duplication massive d'annonces détectée")
    }
  }

  const suspiciousClicks = await queryOne<{ count: number }>(
    `SELECT COUNT(*) as count FROM ProductEvent
     WHERE productId = ? AND event = 'click' AND createdAt > DATE_SUB(NOW(), INTERVAL 24 HOUR)
     HAVING count > (SELECT AVG(cnt) * 10 FROM (
       SELECT COUNT(*) as cnt FROM ProductEvent
       WHERE event = 'click' AND createdAt > DATE_SUB(NOW(), INTERVAL 24 HOUR)
       GROUP BY productId
     ) as avg_clicks)`,
    [productId]
  )

  if (suspiciousClicks && suspiciousClicks.count > 0) {
    fraudScore += 20
    reasons.push("Taux de clics anormal (fraude potentielle)")
  }

  return {
    isFraudulent: fraudScore >= 40,
    score: fraudScore,
    reasons,
  }
}

export async function calculateOrganicScore(
  productId: number,
  search?: SearchContext,
  userContext?: UserContext
): Promise<OrganicScore | null> {
  const product = await getProductWithShop(productId)
  if (!product) return null

  const shopId = product.shop_id || product.shopId

  const relevance = calculateRelevanceScore(product, search)
  const quality = calculateQualityScore(product)
  const freshness = calculateFreshnessScore(product.createdAt, product.updatedAt)
  const availability = calculateAvailabilityScore(product.inStock)
  const price = calculatePriceScore(product.price, product.category)

  const sellerReputation = shopId ? await calculateSellerReputationScore(shopId) : 0
  const performance = await calculatePerformanceScore(productId)
  const activity = await calculateActivityScore(productId, shopId)
  const userExperience = calculateUserExperienceScore(product)

  let total =
    relevance * WEIGHTS.relevance +
    quality * WEIGHTS.quality +
    freshness * WEIGHTS.freshness +
    availability * WEIGHTS.availability +
    price * WEIGHTS.price +
    sellerReputation * WEIGHTS.sellerReputation +
    performance * WEIGHTS.performance +
    activity * WEIGHTS.activity +
    userExperience * WEIGHTS.userExperience

  if (userContext) {
    total = applyPersonalization(total, product, userContext)
  }

  const score: OrganicScore = {
    productId,
    relevance,
    quality,
    freshness,
    availability,
    price,
    sellerReputation,
    performance,
    activity,
    userExperience,
    total: Math.round(total * 100) / 100,
  }

  return score
}

export function applyPersonalization(
  baseScore: number,
  product: any,
  context: UserContext
): number {
  let bonus = 0

  if (context.countryId) {
    const countries = [product.countryId, product.targetCountry].filter(Boolean)
    if (countries.includes(context.countryId)) bonus += 10
  }

  if (context.cityId) {
    const cities = [product.cityId, product.targetCity].filter(Boolean)
    if (cities.includes(context.cityId)) bonus += 8
  }

  if (context.districtId) {
    const districts = [product.districtId, product.targetDistrict].filter(Boolean)
    if (districts.includes(context.districtId)) bonus += 5
  }

  if (context.viewedCategories && context.viewedCategories.includes(product.category)) {
    bonus += 7
  }

  if (context.searchHistory) {
    const matches = context.searchHistory.filter(s =>
      product.name?.toLowerCase().includes(s.toLowerCase()) ||
      product.brand?.toLowerCase().includes(s.toLowerCase())
    ).length
    bonus += Math.min(matches * 3, 9)
  }

    if (context.favorites && context.favorites.length > 0) {
      const hasFavorite = context.favorites.includes(product.id)
      if (hasFavorite) bonus += 5
    }

  return baseScore + bonus
}

export function applyRotation(
  scoredProducts: any[],
  threshold: number = ROTATION_THRESHOLD
): any[] {
  if (scoredProducts.length < 2) return scoredProducts

  const groups: { score: number; items: any[] }[] = []
  const sorted = [...scoredProducts].sort((a, b) => b.organicScore - a.organicScore)

  for (const item of sorted) {
    const existingGroup = groups.find(g => Math.abs(g.score - item.organicScore) <= threshold)
    if (existingGroup) {
      existingGroup.items.push(item)
    } else {
      groups.push({ score: item.organicScore, items: [item] })
    }
  }

  const rotated: any[] = []
  const rotationOffset = Math.floor((Date.now() % ROTATION_SEED_INTERVAL) / ROTATION_SEED_INTERVAL * groups.length)

  groups.forEach((group, index) => {
    if (group.items.length === 1) {
      rotated.push(group.items[0])
    } else {
      const groupOffset = (rotationOffset + index) % group.items.length
      const rotatedItems = [
        ...group.items.slice(groupOffset),
        ...group.items.slice(0, groupOffset),
      ]
      rotated.push(...rotatedItems)
    }
  })

  return rotated
}

export function normalizeScores(scoredProducts: any[]): any[] {
  if (scoredProducts.length === 0) return scoredProducts

  const maxScore = Math.max(...scoredProducts.map(p => p.organicScore || 0))
  if (maxScore === 0) return scoredProducts

  return scoredProducts.map(p => ({
    ...p,
    organicScore: maxScore > 0 ? (p.organicScore / maxScore) * 100 : 0,
    organicPercentage: maxScore > 0 ? Math.round((p.organicScore / maxScore) * 100) : 0,
  }))
}

export async function logProductEvent(
  productId: number,
  event: "view" | "click" | "favorite" | "cart_add" | "purchase",
  userId?: number,
  sessionId?: string,
  ip?: string
): Promise<void> {
  try {
    await execute(
      `INSERT INTO ProductEvent (productId, event, userId, sessionId, ip, createdAt)
       VALUES (?, ?, ?, ?, ?, NOW())`,
      [productId, event, userId || null, sessionId || null, ip || null]
    )
  } catch (error) {
    console.error("[ORGANIC_EVENT]", error)
  }
}

export async function batchCalculateScores(
  productIds: number[],
  search?: SearchContext,
  userContext?: UserContext
): Promise<Map<number, OrganicScore>> {
  const scoreMap = new Map<number, OrganicScore>()

  const batchSize = 50
  for (let i = 0; i < productIds.length; i += batchSize) {
    const batch = productIds.slice(i, i + batchSize)
    const results = await Promise.all(
      batch.map(id => calculateOrganicScore(id, search, userContext))
    )
    results.forEach(score => {
      if (score) scoreMap.set(score.productId, score)
    })
  }

  return scoreMap
}

export async function getOrganicProducts(
  searchParams: URLSearchParams,
  page: number,
  limit: number,
  userContext?: UserContext
): Promise<{ products: any[]; total: number; page: number; pageSize: number; totalPages: number }> {
  const category = searchParams.get("category")
  const search = searchParams.get("search")
  const brand = searchParams.get("brand")
  const model = searchParams.get("model")
  const shopId = searchParams.get("shopId")
  const minPrice = searchParams.get("minPrice")
  const maxPrice = searchParams.get("maxPrice")
  const inStock = searchParams.get("inStock")
  const country = searchParams.get("country")
  const city = searchParams.get("city")

  const conditions: string[] = ["p.inStock = 1"]
  const params: any[] = []

  const searchContext: SearchContext = {}
  if (search) {
    searchContext.query = search
    searchContext.keywords = search.split(/\s+/).filter(Boolean)
  }
  if (category && category !== "all") {
    conditions.push("p.category = ?")
    params.push(category)
    searchContext.category = category
  }
  if (brand) {
    conditions.push("p.brand = ?")
    params.push(brand)
    searchContext.brand = brand
  }
  if (model) {
    conditions.push("p.name LIKE ?")
    params.push(`%${model}%`)
    searchContext.model = model
  }
  if (shopId) {
    conditions.push("p.shopId = ?")
    params.push(shopId)
  }
  if (minPrice) {
    conditions.push("p.price >= ?")
    params.push(parseInt(minPrice))
  }
  if (maxPrice) {
    conditions.push("p.price <= ?")
    params.push(parseInt(maxPrice))
  }
  if (inStock === "1") {
    conditions.push("p.inStock = 1")
  }

  const whereSQL = conditions.length > 0 ? "WHERE " + conditions.join(" AND ") : "WHERE 1=1"

  const countResult = await queryOne<{ count: number }>(
    `SELECT COUNT(*) as count FROM Product p ${whereSQL}`,
    params
  )
  const total = countResult?.count ?? 0

  if (total === 0) {
    return { products: [], total: 0, page, pageSize: limit, totalPages: 0 }
  }

  const products = await queryAll<any>(
    `SELECT p.*, s.id as shop_id, s.name as shop_name, s.slug as shop_slug,
            s.logo as shop_logo, s.category as shop_category,
            s.rating as shop_rating, s.reviews as shop_reviews,
            s.totalSales as shop_totalSales, s.sellerVerified as shop_sellerVerified
     FROM Product p
     LEFT JOIN Shop s ON s.id = p.shopId
     ${whereSQL}
     ORDER BY p.updatedAt DESC
     LIMIT ? OFFSET ?`,
    [...params, limit, (page - 1) * limit]
  )

  const productIds = products.map(p => p.id)

  let scoresMap: Map<number, OrganicScore>
  try {
    scoresMap = await batchCalculateScores(productIds, searchContext, userContext)
  } catch (error) {
    console.error("[ORGANIC] batchCalculateScores error:", error)
    scoresMap = new Map()
  }

  const scoredProducts = products.map(product => {
    const score = scoresMap.get(product.id)
    return {
      ...product,
      organicScore: score?.total || 0,
      organicScoreDetails: score || null,
    }
  })

  const sort = searchParams.get("sort")
  if (sort === "price-asc") {
    scoredProducts.sort((a, b) => a.price - b.price)
  } else if (sort === "price-desc") {
    scoredProducts.sort((a, b) => b.price - a.price)
  } else if (sort === "newest") {
    scoredProducts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  } else if (sort === "rating") {
    scoredProducts.sort((a, b) => (b.rating || 0) - (a.rating || 0))
  } else {
    scoredProducts.sort((a, b) => b.organicScore - a.organicScore)
    const rotated = applyRotation(normalizeScores(scoredProducts))
    return {
      products: rotated,
      total,
      page,
      pageSize: limit,
      totalPages: Math.ceil(total / limit),
    }
  }

  return {
    products: normalizeScores(scoredProducts),
    total,
    page,
    pageSize: limit,
    totalPages: Math.ceil(total / limit),
  }
}

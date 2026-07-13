"use server"
import { NextResponse } from "next/server"
import { queryOne, queryAll } from "@/lib/db"
import { checkApiRateLimit, getRateLimitHeaders } from "@/lib/rate-limit"
import { requireAuth } from "@/lib/require-auth"

const PAGE_SIZE = 20

interface OrganicScore {
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
}

async function calculateOrganicScore(productId: number, searchParams?: URLSearchParams, userContext?: any): Promise<OrganicScore> {
  const now = new Date()
  
  const product = await queryOne<any>(
    `SELECT p.*, s.id as shop_id, s.name as shop_name, s.slug as shop_slug, s.logo as shop_logo, s.category as shop_category
     FROM Product p LEFT JOIN Shop s ON s.id = p.shopId WHERE p.id = ?`,
    [productId]
  )
  
  if (!product) return null
  
  const shopId = product.shop_id || product.shopId
  const score: OrganicScore = {
    productId,
    relevance: calculateRelevanceScore(product, searchParams),
    quality: calculateQualityScore(product),
    freshness: calculateFreshnessScore(product.createdAt),
    availability: calculateAvailabilityScore(product.inStock),
    price: 0,
    sellerReputation: 0,
    performance: 0,
    activity: 0,
    userExperience: 0,
    total: 0
  }
  
  if (shopId) {
    const shopStats = await queryOne<any>(
      `SELECT s.rating, s.reviews, s.sellerVerified, s.createdAt, COUNT(DISTINCT p.id) as productCount,
              COUNT(DISTINCT CASE WHEN p.createdAt > DATE_SUB(NOW(), INTERVAL 7 DAY) THEN p.id END) as recentProducts
       FROM Shop s
       LEFT JOIN Product p ON p.shopId = s.id
       WHERE s.id = ?
       GROUP BY s.id`,
      [shopId]
    )
    
    if (shopStats) {
      score.sellerReputation = calculateSellerReputationScore(shopStats)
    }
    
    const badges = await queryAll<any>(
      `SELECT type, label, color, icon FROM ShopBadge WHERE shopId = ?`,
      [shopId]
    )
    score.userExperience += badges.length * 10
  }
  
  score.performance = calculatePerformanceScore(productId, userContext)
  score.activity = calculateActivityScore(productId)
  score.userExperience += calculateUserExperienceScore(product)
  
  const priceScore = calculatePriceScore(product.price)
  score.price = priceScore
  
  score.total = Object.keys(score).reduce((sum, key) => {
    if (key !== 'productId') {
      return sum + (score[key] * (key === 'price' ? 0.8 : 1.0))
    }
    return sum
  }, 0)
  
  return score
}

function calculateRelevanceScore(product: any, searchParams?: URLSearchParams): number {
  let score = 0
  
  const titleMatch = product.name.toLowerCase().includes(searchParams?.get('search') || '') ? 30 : 0
  const descriptionMatch = product.description?.toLowerCase().includes(searchParams?.get('search') || '') ? 20 : 0
  
  const categoryMatch = searchParams?.get('category') && product.category === searchParams.get('category') ? 25 : 0
  
  const brandMatch = searchParams?.get('brand') && product.brand === searchParams.get('brand') ? 15 : 0
  
  const modelMatch = searchParams?.get('model') && product.name.toLowerCase().includes(searchParams.get('model')?.toLowerCase()) ? 10 : 0
  
  score = titleMatch + descriptionMatch + categoryMatch + brandMatch + modelMatch
  return Math.min(score, 100)
}

function calculateQualityScore(product: any): number {
  let score = 0
  
  const imageScore = (product.images && product.images.length > 0) ? 20 : 0
  const hdImageScore = (product.image && product.image.includes('hd') || product.imageQuality === 'hd') ? 15 : 10
  const descriptionScore = product.description?.length > 500 ? 20 : (product.description?.length > 200 ? 15 : (product.description?.length > 50 ? 10 : 0))
  
  const featuresScore = product.hasFeatures || product.specs ? 15 : 0
  const technicalScore = product.hasTechnicalInfo ? 10 : 0
  
  score = imageScore + hdImageScore + descriptionScore + featuresScore + technicalScore
  return Math.min(score, 100)
}

function calculateFreshnessScore(createdAt: string): number {
  const created = new Date(createdAt)
  const daysDiff = Math.floor((new Date().getTime() - created.getTime()) / (1000 * 60 * 60 * 24))
  
  if (daysDiff <= 1) return 100
  if (daysDiff <= 3) return 85
  if (daysDiff <= 7) return 70
  if (daysDiff <= 30) return 50
  if (daysDiff <= 90) return 30
  
  return Math.max(5, 100 - daysDiff * 2)
}

function calculateAvailabilityScore(inStock: boolean): number {
  return inStock ? 100 : 0
}

function calculateSellerReputationScore(shopStats: any): number {
  let score = 0
  
  score += (shopStats.rating || 0) * 30
  score += Math.min(shopStats.reviews || 0, 50)
  score += shopStats.sellerVerified ? 25 : 0
  
  if (shopStats.createdAt) {
    const creationDate = new Date(shopStats.createdAt)
    const accountAge = Math.floor((new Date().getTime() - creationDate.getTime()) / (1000 * 60 * 60 * 24 * 365))
    score += Math.min(accountAge * 5, 50)
  }
  
  score += (shopStats.productCount || 0) * 2
  score += (shopStats.recentProducts || 0) * 5
  
  return Math.min(score, 100)
}

async function calculatePerformanceScore(productId: number, userContext?: any): Promise<number> {
  const stats = await queryOne<any>(
    `SELECT 
             COUNT(DISTINCT CASE WHEN viewedAt > DATE_SUB(NOW(), INTERVAL 30 DAY) THEN id END) as views30,
             COUNT(DISTINCT CASE WHEN clickedAt > DATE_SUB(NOW(), INTERVAL 30 DAY) THEN id END) as clicks30,
             COUNT(DISTINCT CASE WHEN favoritedAt > DATE_SUB(NOW(), INTERVAL 30 DAY) THEN id END) as favorites30,
             COUNT(DISTINCT CASE WHEN addedToCartAt > DATE_SUB(NOW(), INTERVAL 30 DAY) THEN id END) as cartAdds30,
             COUNT(DISTINCT CASE WHEN purchasedAt > DATE_SUB(NOW(), INTERVAL 30 DAY) THEN id END) as purchases30
     FROM ProductViewStats WHERE productId = ?`,
    [productId]
  )
  
  if (!stats) return 0
  
  let score = 0
  score += Math.min(stats.views30 || 0, 1000) * 0.5
  score += Math.min(stats.clicks30 || 0, 100) * 2.0
  score += Math.min(stats.favorites30 || 0, 200) * 1.5
  score += Math.min(stats.cartAdds30 || 0, 100) * 2.0
  score += Math.min(stats.purchases30 || 0, 50) * 5.0
  
  const conversionRate = stats.views30 > 0 ? (stats.clicks30 / stats.views30) * 100 : 0
  score += conversionRate * 1.0
  
  return Math.min(score, 100)
}

async function calculateActivityScore(productId: number): Promise<number> {
  const lastActive = await queryOne<any>(
    `SELECT MAX(createdAt) as lastActivity FROM Product 
     WHERE id = ? OR shopId = (SELECT shopId FROM Product WHERE id = ?) OR id IN 
     (SELECT id FROM Product WHERE shopId = (SELECT shopId FROM Product WHERE id = ?))`,
    [productId, productId, productId]
  )
  
  if (!lastActive?.lastActivity) return 0
  
  const activeDays = Math.floor((new Date().getTime() - new Date(lastActive.lastActivity).getTime()) / (1000 * 60 * 60 * 24))
  
  if (activeDays <= 1) return 100
  if (activeDays <= 3) return 80
  if (activeDays <= 7) return 60
  if (activeDays <= 30) return 40
  
  return Math.max(10, 100 - activeDays * 3)
}

function calculateUserExperienceScore(product: any): number {
  let score = 0
  
  if (product.hasDuplicateReports) score -= 50
  if (product.hasSpamReports) score -= 30
  if (product.hasCopiedContent) score -= 20
  if (product.hasInaccurateInfo) score -= 15
  if (product.hasPoorImages) score -= 25
  if (product.hasMisleadingContent) score -= 40
  
  if (product.responseTime < 60000) score += 20
  if (product.sellerCancelledOrders < 3) score += 15
  if (product.sellerAvailability > 0.8) score += 25
  
  return Math.max(0, Math.min(score, 100))
}

function calculatePriceScore(price: number): number {
  const optimalPriceRange = 5000
  const variance = 20000
  
  if (price <= optimalPriceRange) return 100
  
  const deviationFromOptimal = Math.abs(price - optimalPriceRange) / optimalPriceRange
  const score = Math.max(0, 100 - (deviationFromOptimal * 100))
  
  if (price > optimalPriceRange * 5) return 0
  
  return score
}

async function getOrganicProducts(searchParams: URLSearchParams, page: number, limit: number, userContext?: any): Promise<any[]> {
  const category = searchParams.get('category')
  const search = searchParams.get('search')
  const sort = searchParams.get('sort')
  const shopId = searchParams.get('shopId')
  
  let conditions = []
  let params = []
  
  if (category && category !== 'all') {
    conditions.push('p.category = ?')
    params.push(category)
  }
  
  if (search) {
    conditions.push('(p.name LIKE ? OR p.brand LIKE ? OR p.description LIKE ?)')
    params.push(`%${search}%`, `%${search}%`, `%${search}%`)
  }
  
  if (shopId) {
    conditions.push('p.shopId = ?')
    params.push(shopId)
  }
  
  const whereSQL = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : ''
  
  const products = await queryAll<any>(
    `SELECT p.* FROM Product p ${whereSQL} AND p.promotion = 0 AND p.inStock = 1 AND p.sellerVerified = 1 LIMIT ? OFFSET ?`,
    [...params, limit, (page - 1) * limit]
  )
  
  const scoredProducts = await Promise.all(
    products.map(async (product) => {
      const score = await calculateOrganicScore(product.id, searchParams, userContext)
      return { ...product, organicScore: score?.total || 0, score }
    })
  )
  
  scoredProducts.sort((a, b) => {
    if (sort === 'price-asc') return a.price - b.price
    if (sort === 'price-desc') return b.price - a.price
    if (sort === 'newest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    if (sort === 'rating') return (b.rating || 0) - (a.rating || 0)
    
    return b.organicScore - a.organicScore
  })
  
  if (scoredProducts.length > 1 && scoredProducts[0].organicScore === scoredProducts[1].organicScore) {
    return scoredProducts.map((p, index) => {
      const variation = index === 0 ? 1.5 : (index === scoredProducts.length - 1 ? 0.5 : 1.0)
      return { ...p, organicScore: p.organicScore * variation }
    }).sort((a, b) => b.organicScore - a.organicScore)
  }
  
  return scoredProducts
}

export async function GET(request: Request) {
  try {
    const auth = await requireAuth(request)
    if (!auth.success) return auth.response
    
    const ip = request.headers.get('x-forwarded-for') || 'unknown'
    const rateLimit = checkApiRateLimit(`organic:${ip}`)
    const headers = rateLimit.allowed ? getRateLimitHeaders(rateLimit) : {}
    
    if (!rateLimit.allowed) {
      return NextResponse.json({ error: 'Trop de requêtes' }, { status: 429, headers })
    }
    
    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || String(PAGE_SIZE))))
    
    const products = await getOrganicProducts(searchParams, page, limit)
    
    return NextResponse.json({ products }, { headers })
  } catch (error) {
    console.error('[ORGANIC_RANKING]', error)
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}

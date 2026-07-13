import { queryOne, queryAll, execute } from "@/lib/db"
import type { AiRecommendation } from "@/lib/services-pro-types"

export async function getRecommendations(shopId: string, type?: string): Promise<AiRecommendation[]> {
  const sql = type
    ? "SELECT * FROM AiRecommendation WHERE shopId = ? AND type = ? AND dismissed = 0 ORDER BY confidence DESC, createdAt DESC"
    : "SELECT * FROM AiRecommendation WHERE shopId = ? AND dismissed = 0 ORDER BY confidence DESC, createdAt DESC"
  const params = type ? [shopId, type] : [shopId]
  return queryAll<AiRecommendation>(sql, params)
}

export async function createRecommendation(shopId: string, data: {
  productId?: number; type: string; title: string; description?: string; data: any; confidence: number
}): Promise<void> {
  await execute(
    `INSERT INTO AiRecommendation (shopId, productId, type, title, description, data, confidence)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [shopId, data.productId || null, data.type, data.title, data.description || null,
     JSON.stringify(data.data), data.confidence]
  )
}

export async function applyRecommendation(id: number): Promise<void> {
  const rec = await queryOne<any>("SELECT * FROM AiRecommendation WHERE id = ?", [id])
  if (!rec) return

  if (rec.type === 'price' && rec.data.recommendedPrice) {
    await execute(
      "UPDATE Product SET price = ? WHERE id = ?",
      [rec.data.recommendedPrice, rec.productId]
    )
    await execute(
      `INSERT INTO AiPricingHistory (shopId, productId, oldPrice, recommendedPrice, appliedPrice, reason, confidence)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [rec.shopId, rec.productId, rec.data.currentPrice, rec.data.recommendedPrice,
       rec.data.recommendedPrice, rec.description, rec.confidence]
    )
  }

  await execute(
    "UPDATE AiRecommendation SET applied = 1, appliedAt = NOW() WHERE id = ?",
    [id]
  )
}

export async function dismissRecommendation(id: number): Promise<void> {
  await execute("UPDATE AiRecommendation SET dismissed = 1 WHERE id = ?", [id])
}

export async function generatePriceRecommendation(shopId: string, productId: number): Promise<void> {
  const product = await queryOne<any>("SELECT * FROM Product WHERE id = ? AND shopId = ?", [productId, shopId])
  if (!product) return

  const similarProducts = await queryAll<any>(
    `SELECT price, rating, reviews FROM Product
     WHERE category = ? AND id != ? AND price > 0
     ORDER BY rating DESC, reviews DESC LIMIT 20`,
    [product.category, productId]
  )

  if (similarProducts.length < 3) return

  const avgPrice = similarProducts.reduce((s, p) => s + p.price, 0) / similarProducts.length
  const minPrice = Math.min(...similarProducts.map(p => p.price))
  const maxPrice = Math.max(...similarProducts.map(p => p.price))

  let recommendedPrice = Math.round(avgPrice)
  let confidence = 50
  let reason = "Prix recommandé basé sur la moyenne des produits similaires"

  if (product.price > maxPrice) {
    recommendedPrice = Math.round(maxPrice * 0.95)
    confidence = 70
    reason = "Votre produit est plus cher que le maximum du marché. Réduire le prix pourrait augmenter les ventes."
  } else if (product.price < minPrice) {
    recommendedPrice = Math.round(avgPrice)
    confidence = 40
    reason = "Votre produit est moins cher que le minimum du marché. Vous pourriez augmenter légèrement le prix."
  } else if (product.price > avgPrice * 1.2) {
    recommendedPrice = Math.round(avgPrice * 1.1)
    confidence = 65
    reason = "Votre prix est supérieur à la moyenne. Léger ajustement recommandé."
  } else if (product.price < avgPrice * 0.8) {
    recommendedPrice = Math.round(avgPrice * 0.9)
    confidence = 55
    reason = "Votre prix est inférieur à la moyenne. Petite augmentation possible."
  }

  const existing = await queryOne<any>(
    "SELECT id FROM AiRecommendation WHERE shopId = ? AND productId = ? AND type = 'price' AND applied = 0 AND dismissed = 0",
    [shopId, productId]
  )
  if (existing) return

  await createRecommendation(shopId, {
    productId,
    type: 'price',
    title: `Recommandation de prix pour ${product.name}`,
    description: reason,
    data: {
      currentPrice: product.price,
      recommendedPrice,
      avgPrice: Math.round(avgPrice),
      minPrice,
      maxPrice,
      similarCount: similarProducts.length,
    },
    confidence,
  })
}

export async function detectUnderperformingProducts(shopId: string): Promise<void> {
  const products = await queryAll<any>(
    `SELECT p.id, p.name, p.price, p.rating, p.reviews, p.views,
            COUNT(oi.id) as salesCount
     FROM Product p
     LEFT JOIN OrderItem oi ON oi.productId = p.id
     WHERE p.shopId = ?
     GROUP BY p.id
     HAVING (p.rating < 3.5 AND p.reviews > 0) OR (p.reviews = 0 AND p.views > 100) OR (salesCount = 0 AND p.views > 200)
     ORDER BY p.views DESC`,
    [shopId]
  )

  for (const p of products) {
    const existing = await queryOne<any>(
      "SELECT id FROM AiRecommendation WHERE shopId = ? AND productId = ? AND type = 'detection' AND dismissed = 0",
      [shopId, p.id]
    )
    if (existing) continue

    let reason = ""
    if (p.rating < 3.5 && p.reviews > 0) {
      reason = `Ce produit a une note faible (${p.rating}/5). Améliorez la fiche ou les images.`
    } else if (p.reviews === 0 && Number(p.views) > 100) {
      reason = "Beaucoup de vues mais aucun achat. Vérifiez le prix et la description."
    } else {
      reason = "Produit consulté mais jamais vendu. Envisagez une promotion."
    }

    await createRecommendation(shopId, {
      productId: p.id,
      type: 'detection',
      title: `Produit peu performant : ${p.name}`,
      description: reason,
      data: { rating: p.rating, reviews: p.reviews, views: Number(p.views), sales: Number(p.salesCount || 0) },
      confidence: 75,
    })
  }
}

export async function generatePublishingRecommendation(shopId: string): Promise<void> {
  const hourlyData = await queryAll<any>(
    `SELECT HOUR(createdAt) as hour, COUNT(*) as sales
     FROM OrderItem oi
     JOIN \`Order\` o ON o.id = oi.orderId
     JOIN Product p ON p.id = oi.productId
     WHERE p.shopId = ? AND o.createdAt >= DATE_SUB(NOW(), INTERVAL 30 DAY)
     GROUP BY HOUR(createdAt) ORDER BY sales DESC`,
    [shopId]
  )

  if (hourlyData.length === 0) return

  const bestHour = hourlyData[0].hour
  const existing = await queryOne<any>(
    "SELECT id FROM AiRecommendation WHERE shopId = ? AND type = 'publishing' AND dismissed = 0",
    [shopId]
  )
  if (existing) return

  await createRecommendation(shopId, {
    type: 'publishing',
    title: 'Meilleur moment pour publier',
    description: `Les ventes sont les plus élevées à ${bestHour}h. Programmez vos publications à ce moment.`,
    data: { bestHour, hourlyBreakdown: hourlyData },
    confidence: 80,
  })
}

export async function estimateSales(shopId: string, productId: number): Promise<void> {
  const product = await queryOne<any>("SELECT * FROM Product WHERE id = ? AND shopId = ?", [productId, shopId])
  if (!product) return

  const history = await queryAll<any>(
    `SELECT DATE(o.createdAt) as date, SUM(oi.quantity) as quantity
     FROM OrderItem oi
     JOIN \`Order\` o ON o.id = oi.orderId
     WHERE oi.productId = ? AND o.createdAt >= DATE_SUB(NOW(), INTERVAL 30 DAY)
     GROUP BY DATE(o.createdAt) ORDER BY date ASC`,
    [productId]
  )

  const totalSold = history.reduce((s, h) => s + Number(h.quantity || 0), 0)
  const dailyAvg = history.length > 0 ? totalSold / history.length : 0

  const existing = await queryOne<any>(
    "SELECT id FROM AiRecommendation WHERE shopId = ? AND productId = ? AND type = 'sales_forecast' AND dismissed = 0",
    [shopId, productId]
  )
  if (existing) return

  await createRecommendation(shopId, {
    productId,
    type: 'sales_forecast',
    title: `Estimation des ventes pour ${product.name}`,
    description: `Ventes quotidiennes moyennes : ${dailyAvg.toFixed(1)} unités. Projection sur 30 jours : ${Math.round(dailyAvg * 30)} unités.`,
    data: { dailyAvg, projected30: Math.round(dailyAvg * 30), history, totalSold },
    confidence: 70,
  })
}

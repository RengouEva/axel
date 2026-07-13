import { NextResponse } from "next/server"
import { queryAll, queryOne } from "@/lib/db"
import { checkApiRateLimit, getRateLimitHeaders } from "@/lib/rate-limit"
import { requireRole } from "@/lib/require-auth"

export async function GET(request: Request) {
  try {
    const ip = request.headers.get("x-forwarded-for") || "unknown"
    const rateLimit = checkApiRateLimit(`organic-fraud:${ip}`)
    const headers = getRateLimitHeaders(rateLimit)

    if (!rateLimit.allowed) {
      return NextResponse.json({ error: "Trop de requêtes" }, { status: 429, headers })
    }

    const { searchParams } = new URL(request.url)
    const productId = searchParams.get("productId")
    const status = searchParams.get("status") || "pending"
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"))
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20")))

    if (productId) {
      const reports = await queryAll<any>(
        `SELECT f.*, u.name as reportedByName, r.name as reviewedByName
         FROM FraudReport f
         LEFT JOIN User u ON u.id = f.reportedBy
         LEFT JOIN User r ON r.id = f.reviewedBy
         WHERE f.productId = ?
         ORDER BY f.createdAt DESC`,
        [productId]
      )
      return NextResponse.json({ reports }, { headers })
    }

    const offset = (page - 1) * limit
    const [reports, countRow] = await Promise.all([
      queryAll<any>(
        `SELECT f.*, p.name as productName, p.slug as productSlug, u.name as reportedByName
         FROM FraudReport f
         LEFT JOIN Product p ON p.id = f.productId
         LEFT JOIN User u ON u.id = f.reportedBy
         WHERE f.status = ?
         ORDER BY f.score DESC, f.createdAt DESC
         LIMIT ? OFFSET ?`,
        [status, limit, offset]
      ),
      queryOne<{ count: number }>(
        "SELECT COUNT(*) as count FROM FraudReport WHERE status = ?",
        [status]
      ),
    ])

    return NextResponse.json({
      reports,
      total: countRow?.count ?? 0,
      page,
      pageSize: limit,
      totalPages: Math.ceil((countRow?.count ?? 0) / limit),
    }, { headers })
  } catch (error) {
    console.error("[ORGANIC_FRAUD_GET]", error)
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const ip = request.headers.get("x-forwarded-for") || "unknown"
    const rateLimit = checkApiRateLimit(`organic-fraud-post:${ip}`)
    const headers = getRateLimitHeaders(rateLimit)

    if (!rateLimit.allowed) {
      return NextResponse.json({ error: "Trop de requêtes" }, { status: 429, headers })
    }

    const auth = await requireRole(request, ["seller", "admin"])
    if (!auth.success) return auth.response

    const body = await request.json()
    const { action, reportId, productId, reason, details, status, actionTaken } = body

    if (action === "report" && productId && reason) {
      const { execute } = await import("@/lib/db")
      const result = await execute(
        `INSERT INTO FraudReport (productId, reportedBy, reason, details, status)
         VALUES (?, ?, ?, ?, 'pending')`,
        [productId, auth.user.userId, reason, details || null]
      )
      return NextResponse.json({ success: true, reportId: result.insertId }, { headers })
    }

    if (action === "review" && reportId && status) {
      const auth2 = await requireRole(request, ["admin"])
      if (!auth2.success) return auth2.response

      const { execute } = await import("@/lib/db")
      await execute(
        `UPDATE FraudReport SET status = ?, actionTaken = ?, reviewedBy = ?, reviewedAt = NOW() WHERE id = ?`,
        [status, actionTaken || null, auth.user.userId, reportId]
      )

      if (status === "confirmed" && body.productId) {
        await execute(
          `UPDATE Product SET isSpam = 1, hasMisleadingContent = 1 WHERE id = ?`,
          [body.productId]
        )
      }

      return NextResponse.json({ success: true }, { headers })
    }

    return NextResponse.json({ error: "Action non valide" }, { status: 400, headers })
  } catch (error) {
    console.error("[ORGANIC_FRAUD_POST]", error)
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 })
  }
}

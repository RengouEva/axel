"use server"
import { NextResponse } from "next/server"
import { queryAll, queryOne, execute } from "@/lib/db"
import { requireRole } from "@/lib/require-auth"

export async function GET(request: Request) {
  const auth = await requireRole(request, ["admin"])
  if (!auth.success) return auth.response

  const { searchParams } = new URL(request.url)
  const page = Math.max(1, Number(searchParams.get("page")) || 1)
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit")) || 50))
  const offset = (page - 1) * limit

  try {
    const [totalRow] = await queryAll<{ count: number }>("SELECT COUNT(*) as count FROM OrganicScoreCache")
    const total = totalRow?.count || 0

    const scores = await queryAll<any>(
      `SELECT osc.*, p.name as productName, p.image, p.price, p.category, p.slug, s.name as shopName
       FROM OrganicScoreCache osc
       LEFT JOIN Product p ON p.id = osc.productId
       LEFT JOIN Shop s ON s.id = p.shopId
       ORDER BY osc.totalScore DESC
       LIMIT ? OFFSET ?`,
      [limit, offset]
    )

    return NextResponse.json({ scores, total, page, totalPages: Math.ceil(total / limit) })
  } catch (e: unknown) {
    const err = e as { message?: string }
    return NextResponse.json({ error: err?.message || "Erreur" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const auth = await requireRole(request, ["admin"])
  if (!auth.success) return auth.response

  try {
    const body = await request.json()
    if (body.action === "refresh") {
      await execute("DELETE FROM OrganicScoreCache")
      await execute(
        `INSERT INTO OrganicScoreCache (productId, totalScore, calculatedAt, expiresAt)
         SELECT p.id, 0, NOW(), DATE_ADD(NOW(), INTERVAL 5 MINUTE) FROM Product p`
      )
      return NextResponse.json({ success: true, message: "Cache regénéré" })
    }
    return NextResponse.json({ error: "Action invalide" }, { status: 400 })
  } catch (e: unknown) {
    const err = e as { message?: string }
    return NextResponse.json({ error: err?.message || "Erreur" }, { status: 500 })
  }
}

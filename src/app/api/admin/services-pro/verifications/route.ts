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
  const status = searchParams.get("status")

  try {
    const conditions = ["1=1"]
    const params: unknown[] = []
    if (status) { conditions.push("sv.status = ?"); params.push(status) }

    const whereSQL = "WHERE " + conditions.join(" AND ")
    const [totalRow] = await queryAll<{ count: number }>(
      `SELECT COUNT(*) as count FROM SellerVerification sv ${whereSQL}`
    )
    const total = totalRow?.count || 0
    const verifications = await queryAll<any>(
      `SELECT sv.*, s.name as shopName, s.slug, s.sellerId, u.name as sellerName, u.email as sellerEmail
       FROM SellerVerification sv
       LEFT JOIN Shop s ON s.id = sv.shopId
       LEFT JOIN User u ON u.id = s.sellerId
       ${whereSQL}
       ORDER BY sv.createdAt DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    )

    return NextResponse.json({ verifications, total, page, totalPages: Math.ceil(total / limit) })
  } catch (e: unknown) {
    const err = e as { message?: string }
    return NextResponse.json({ error: err?.message || "Erreur" }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  const auth = await requireRole(request, ["admin"])
  if (!auth.success) return auth.response

  try {
    const body = await request.json()
    const { id, status, rejectionReason } = body
    if (!id || !status) {
      return NextResponse.json({ error: "id et status requis" }, { status: 400 })
    }
    if (!["approved", "rejected"].includes(status)) {
      return NextResponse.json({ error: "Status invalide" }, { status: 400 })
    }

    await execute(
      "UPDATE SellerVerification SET status = ?, rejectionReason = ?, reviewedAt = NOW() WHERE id = ?",
      [status, rejectionReason || null, id]
    )
    return NextResponse.json({ success: true })
  } catch (e: unknown) {
    const err = e as { message?: string }
    return NextResponse.json({ error: err?.message || "Erreur" }, { status: 500 })
  }
}

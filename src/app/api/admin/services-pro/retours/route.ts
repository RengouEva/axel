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
    if (status) { conditions.push("rr.status = ?"); params.push(status) }

    const whereSQL = "WHERE " + conditions.join(" AND ")
    const [totalRow] = await queryAll<{ count: number }>(
      `SELECT COUNT(*) as count FROM ReturnRequest rr ${whereSQL}`
    )
    const total = totalRow?.count || 0
    const retours = await queryAll<any>(
      `SELECT rr.*, s.name as shopName, u.name as clientName, u.email as clientEmail, p.name as productName
       FROM ReturnRequest rr
       LEFT JOIN Shop s ON s.id = rr.shopId
       LEFT JOIN User u ON u.id = rr.userId
       LEFT JOIN Product p ON p.id = rr.productId
       ${whereSQL}
       ORDER BY rr.createdAt DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    )

    return NextResponse.json({ retours, total, page, totalPages: Math.ceil(total / limit) })
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
    const { id, status, notes } = body
    if (!id || !status) {
      return NextResponse.json({ error: "id et status requis" }, { status: 400 })
    }
    if (!["approved", "rejected", "refunded", "picked_up", "received", "cancelled"].includes(status)) {
      return NextResponse.json({ error: "Status invalide" }, { status: 400 })
    }

    const updateFields = ["status = ?"]
    const updateParams: unknown[] = [status]

    if (notes) { updateFields.push("notes = ?"); updateParams.push(notes) }
    if (status === "refunded") { updateFields.push("refundedAt = NOW()") }
    if (["approved", "rejected"].includes(status)) { updateFields.push("reviewedAt = NOW()") }

    updateParams.push(id)
    await execute(
      `UPDATE ReturnRequest SET ${updateFields.join(", ")} WHERE id = ?`,
      updateParams
    )
    return NextResponse.json({ success: true })
  } catch (e: unknown) {
    const err = e as { message?: string }
    return NextResponse.json({ error: err?.message || "Erreur" }, { status: 500 })
  }
}

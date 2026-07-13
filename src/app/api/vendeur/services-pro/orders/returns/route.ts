import { NextResponse } from "next/server"
import { requireRole } from "@/lib/require-auth"
import { queryOne } from "@/lib/db"
import { validateInput, returnReviewSchema } from "@/lib/services-pro-validations"
import { getReturnRequests, updateReturnRequest } from "@/data/services-pro/orders"

export async function GET(request: Request) {
  try {
    const auth = await requireRole(request, ["seller", "admin"])
    if (!auth.success) return auth.response

    const shop = await queryOne<any>("SELECT * FROM Shop WHERE sellerId = ?", [auth.user.userId])
    if (!shop) return NextResponse.json({ error: "Boutique introuvable" }, { status: 404 })

    const returns = await getReturnRequests(shop.id)
    return NextResponse.json({ returns })
  } catch (error) {
    console.error("[SERVICES_PRO_RETURNS_GET]", error)
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const auth = await requireRole(request, ["seller", "admin"])
    if (!auth.success) return auth.response

    const body = await request.json()
    const validation = validateInput(returnReviewSchema, body)
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    await updateReturnRequest(validation.data.requestId, {
      status: validation.data.status,
      refundAmount: validation.data.refundAmount,
      refundMethod: validation.data.refundMethod,
      notes: validation.data.notes,
      reviewedBy: auth.user.userId,
    })
    return NextResponse.json({ message: "Demande de retour mise à jour" })
  } catch (error) {
    console.error("[SERVICES_PRO_RETURNS_PUT]", error)
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 })
  }
}

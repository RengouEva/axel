import { NextResponse } from "next/server"
import { queryAll, queryOne, execute } from "@/lib/db"
import { requireRole } from "@/lib/require-auth"

export async function GET(request: Request) {
  try {
    const auth = await requireRole(request, ["admin", "seller"])
    if (!auth.success) return auth.response

    const placements = await queryAll<any>(
      "SELECT * FROM AdPlacement ORDER BY slot ASC"
    )

    return NextResponse.json({ placements })
  } catch (error) {
    console.error("[ADS_PLACEMENTS_GET]", error)
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const auth = await requireRole(request, ["admin"])
    if (!auth.success) return auth.response

    const body = await request.json()
    const { id, basePrice, isActive, auctionEnabled } = body

    if (!id) {
      return NextResponse.json({ error: "ID requis" }, { status: 400 })
    }

    const updates: string[] = []
    const params: unknown[] = []

    if (basePrice !== undefined) { updates.push("basePrice = ?"); params.push(basePrice) }
    if (isActive !== undefined) { updates.push("isActive = ?"); params.push(isActive ? 1 : 0) }
    if (auctionEnabled !== undefined) { updates.push("auctionEnabled = ?"); params.push(auctionEnabled ? 1 : 0) }

    if (updates.length > 0) {
      params.push(id)
      await execute(`UPDATE AdPlacement SET ${updates.join(", ")} WHERE id = ?`, params)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[ADS_PLACEMENTS_PUT]", error)
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 })
  }
}

import { NextResponse } from "next/server"
import { requireRole } from "@/lib/require-auth"
import { queryOne } from "@/lib/db"
import { getReports, generateReport } from "@/data/services-pro/reports"

export async function GET(request: Request) {
  try {
    const auth = await requireRole(request, ["seller", "admin"])
    if (!auth.success) return auth.response

    const shop = await queryOne<any>("SELECT * FROM Shop WHERE sellerId = ?", [auth.user.userId])
    if (!shop) return NextResponse.json({ error: "Boutique introuvable" }, { status: 404 })

    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type") || undefined

    const reports = await getReports(shop.id, type)
    return NextResponse.json({ reports })
  } catch (error) {
    console.error("[SERVICES_PRO_REPORTS_GET]", error)
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireRole(request, ["seller", "admin"])
    if (!auth.success) return auth.response

    const shop = await queryOne<any>("SELECT * FROM Shop WHERE sellerId = ?", [auth.user.userId])
    if (!shop) return NextResponse.json({ error: "Boutique introuvable" }, { status: 404 })

    const body = await request.json()
    const type = body.type as 'daily' | 'weekly' | 'monthly' | 'yearly'
    if (!['daily', 'weekly', 'monthly', 'yearly'].includes(type)) {
      return NextResponse.json({ error: "Type de rapport invalide" }, { status: 400 })
    }

    const report = await generateReport(shop.id, type)
    return NextResponse.json({ report })
  } catch (error) {
    console.error("[SERVICES_PRO_REPORTS_POST]", error)
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 })
  }
}

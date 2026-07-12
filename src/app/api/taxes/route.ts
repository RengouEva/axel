import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/require-auth"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const countryId = searchParams.get("countryId")

    if (countryId) {
      const rate = await prisma.taxRate.findUnique({ where: { countryId } })
      return NextResponse.json({ rate: rate?.rate ?? 19.25 })
    }

    const rates = await prisma.taxRate.findMany({ orderBy: { countryId: "asc" } })
    return NextResponse.json({ rates })
  } catch (error) {
    console.error("[TAXES_GET]", error)
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireRole(request, ["admin"])
    if (!auth.success) return auth.response

    const body = await request.json()
    const { action, rates } = body

    if (action === "save" && Array.isArray(rates)) {
      for (const rate of rates) {
        await prisma.taxRate.upsert({
          where: { countryId: rate.countryId },
          update: { rate: rate.rate, label: rate.label },
          create: { countryId: rate.countryId, rate: rate.rate, label: rate.label },
        })
      }
      return NextResponse.json({ success: true })
    }

    if (action === "reset") {
      const existing = await prisma.taxRate.findMany()
      for (const rate of existing) {
        await prisma.taxRate.upsert({
          where: { countryId: rate.countryId },
          update: { rate: rate.rate, label: rate.label },
          create: { countryId: rate.countryId, rate: rate.rate, label: rate.label },
        })
      }
      return NextResponse.json({ success: true, rates: existing })
    }

    return NextResponse.json({ error: "Action invalide" }, { status: 400 })
  } catch (error) {
    console.error("[TAXES_POST]", error)
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 })
  }
}

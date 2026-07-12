import { NextResponse } from "next/server"
import { queryOne, queryAll, execute } from "@/lib/db"
import { requireRole } from "@/lib/require-auth"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const countryId = searchParams.get("countryId")

    if (countryId) {
      const rate = await queryOne<any>("SELECT rate FROM TaxRate WHERE countryId = ?", [countryId])
      return NextResponse.json({ rate: rate?.rate ?? 19.25 })
    }

    const rates = await queryAll<any>("SELECT * FROM TaxRate ORDER BY countryId ASC")
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
        const existing = await queryOne<any>("SELECT id FROM TaxRate WHERE countryId = ?", [rate.countryId])
        if (existing) {
          await execute("UPDATE TaxRate SET rate = ?, label = ? WHERE countryId = ?", [rate.rate, rate.label, rate.countryId])
        } else {
          await execute("INSERT INTO TaxRate (countryId, rate, label) VALUES (?, ?, ?)", [rate.countryId, rate.rate, rate.label])
        }
      }
      return NextResponse.json({ success: true })
    }

    if (action === "reset") {
      const existing = await queryAll<any>("SELECT * FROM TaxRate")
      for (const rate of existing) {
        const exists = await queryOne<any>("SELECT id FROM TaxRate WHERE countryId = ?", [rate.countryId])
        if (exists) {
          await execute("UPDATE TaxRate SET rate = ?, label = ? WHERE countryId = ?", [rate.rate, rate.label, rate.countryId])
        } else {
          await execute("INSERT INTO TaxRate (countryId, rate, label) VALUES (?, ?, ?)", [rate.countryId, rate.rate, rate.label])
        }
      }
      return NextResponse.json({ success: true, rates: existing })
    }

    return NextResponse.json({ error: "Action invalide" }, { status: 400 })
  } catch (error) {
    console.error("[TAXES_POST]", error)
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 })
  }
}

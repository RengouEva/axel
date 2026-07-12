import { NextResponse } from "next/server"
import { queryOne, queryAll, execute } from "@/lib/db"
import { validateInput, planCreateSchema } from "@/lib/validations"
import { requireRole } from "@/lib/require-auth"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const all = searchParams.get("all") === "true"

    if (all) {
      const auth = await requireRole(request, ["admin"])
      if (!auth.success) return auth.response

      const plans = await queryAll<any>("SELECT * FROM Plan ORDER BY price ASC")
      return NextResponse.json(plans)
    }

    const plans = await queryAll<any>(
      "SELECT * FROM Plan WHERE isActive = 1 ORDER BY price ASC"
    )
    return NextResponse.json(plans)
  } catch (error) {
    console.error("[PLANS_GET]", error)
    return NextResponse.json({ error: "Erreur interne du serveur" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireRole(request, ["admin"])
    if (!auth.success) return auth.response

    const body = await request.json()
    const validation = validateInput(planCreateSchema, body)
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    const data = validation.data as Record<string, unknown>
    const fields = Object.keys(data)
    const placeholders = fields.map(() => "?").join(", ")
    const values = Object.values(data)
    const result = await execute(`INSERT INTO Plan (${fields.join(", ")}) VALUES (${placeholders})`, values)
    const plan = await queryOne<any>("SELECT * FROM Plan WHERE id = ?", [result.insertId])
    return NextResponse.json(plan, { status: 201 })
  } catch (error) {
    console.error("[PLANS_POST]", error)
    return NextResponse.json({ error: "Erreur interne du serveur" }, { status: 500 })
  }
}

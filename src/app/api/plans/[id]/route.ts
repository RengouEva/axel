import { NextResponse } from "next/server"
import { queryOne, execute } from "@/lib/db"
import { validateInput, planUpdateSchema } from "@/lib/validations"
import { requireRole } from "@/lib/require-auth"

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireRole(request, ["admin"])
    if (!auth.success) return auth.response

    const { id } = await params
    const planId = Number(id)

    const existing = await queryOne<any>("SELECT id FROM Plan WHERE id = ?", [planId])
    if (!existing) {
      return NextResponse.json({ error: "Plan non trouvé" }, { status: 404 })
    }

    const body = await request.json()
    const validation = validateInput(planUpdateSchema, body)
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    const updates = validation.data as Record<string, unknown>
    const setClauses = Object.keys(updates).map(k => `${k} = ?`)
    const values = Object.values(updates)
    await execute(`UPDATE Plan SET ${setClauses.join(", ")} WHERE id = ?`, [...values, planId])

    const plan = await queryOne<any>("SELECT * FROM Plan WHERE id = ?", [planId])
    return NextResponse.json(plan)
  } catch (error) {
    console.error("[PLAN_PUT]", error)
    return NextResponse.json({ error: "Erreur interne du serveur" }, { status: 500 })
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireRole(_request, ["admin"])
    if (!auth.success) return auth.response

    const { id } = await params
    const planId = Number(id)

    const existing = await queryOne<any>("SELECT id FROM Plan WHERE id = ?", [planId])
    if (!existing) {
      return NextResponse.json({ error: "Plan non trouvé" }, { status: 404 })
    }

    await execute("DELETE FROM Plan WHERE id = ?", [planId])
    return NextResponse.json({ message: "Plan supprimé" })
  } catch (error) {
    console.error("[PLAN_DELETE]", error)
    return NextResponse.json({ error: "Erreur interne du serveur" }, { status: 500 })
  }
}

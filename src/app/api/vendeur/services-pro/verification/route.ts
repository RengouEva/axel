import { NextResponse } from "next/server"
import { requireRole } from "@/lib/require-auth"
import { queryOne } from "@/lib/db"
import { validateInput, verificationSubmitSchema } from "@/lib/services-pro-validations"
import { getVerification, submitVerification } from "@/data/services-pro/verification"

export async function GET(request: Request) {
  try {
    const auth = await requireRole(request, ["seller", "admin"])
    if (!auth.success) return auth.response

    const shop = await queryOne<any>("SELECT * FROM Shop WHERE sellerId = ?", [auth.user.userId])
    if (!shop) return NextResponse.json({ error: "Boutique introuvable" }, { status: 404 })

    const verification = await getVerification(shop.id)
    return NextResponse.json({ verification: verification || null })
  } catch (error) {
    console.error("[SERVICES_PRO_VERIFICATION_GET]", error)
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
    const validation = validateInput(verificationSubmitSchema, body)
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    const verification = await submitVerification(shop.id, validation.data)
    return NextResponse.json({ verification, message: "Vérification soumise avec succès" })
  } catch (error) {
    console.error("[SERVICES_PRO_VERIFICATION_POST]", error)
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 })
  }
}

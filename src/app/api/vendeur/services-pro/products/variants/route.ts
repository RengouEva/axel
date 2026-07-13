import { NextResponse } from "next/server"
import { requireRole } from "@/lib/require-auth"
import { queryOne } from "@/lib/db"
import { validateInput, variantSchema } from "@/lib/services-pro-validations"
import { getVariants, createVariant, updateVariant, deleteVariant } from "@/data/services-pro/products"

export async function GET(request: Request) {
  try {
    const auth = await requireRole(request, ["seller", "admin"])
    if (!auth.success) return auth.response

    const { searchParams } = new URL(request.url)
    const productId = parseInt(searchParams.get("productId") || "0")
    if (!productId) return NextResponse.json({ error: "ID produit requis" }, { status: 400 })

    const variants = await getVariants(productId)
    return NextResponse.json({ variants })
  } catch (error) {
    console.error("[SERVICES_PRO_VARIANTS_GET]", error)
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireRole(request, ["seller", "admin"])
    if (!auth.success) return auth.response

    const body = await request.json()
    const validation = validateInput(variantSchema, body)
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    const variant = await createVariant(validation.data)
    return NextResponse.json({ variant }, { status: 201 })
  } catch (error) {
    console.error("[SERVICES_PRO_VARIANTS_POST]", error)
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const auth = await requireRole(request, ["seller", "admin"])
    if (!auth.success) return auth.response

    const body = await request.json()
    const { id, ...data } = body
    if (!id) return NextResponse.json({ error: "ID de variante requis" }, { status: 400 })

    await updateVariant(id, data)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[SERVICES_PRO_VARIANTS_PUT]", error)
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const auth = await requireRole(request, ["seller", "admin"])
    if (!auth.success) return auth.response

    const { searchParams } = new URL(request.url)
    const id = parseInt(searchParams.get("id") || "0")
    if (!id) return NextResponse.json({ error: "ID de variante requis" }, { status: 400 })

    await deleteVariant(id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[SERVICES_PRO_VARIANTS_DELETE]", error)
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 })
  }
}

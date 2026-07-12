import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { validateInput, shopUpdateSchema } from "@/lib/validations"
import { requireAuth } from "@/lib/require-auth"
import { checkApiRateLimit, getRateLimitHeaders } from "@/lib/rate-limit"

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const shop = await prisma.shop.findUnique({
      where: { id },
      include: {
        seller: { select: { id: true, name: true, email: true } },
      },
    })
    if (!shop) {
      return NextResponse.json({ error: "Boutique non trouvée" }, { status: 404 })
    }
    return NextResponse.json(shop)
  } catch (error) {
    console.error("[SHOP_GET]", error)
    return NextResponse.json({ error: "Erreur interne du serveur" }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown"
    const rateLimit = checkApiRateLimit(ip)
    const rateLimitHeaders = getRateLimitHeaders(rateLimit)

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Trop de requêtes. Veuillez réessayer plus tard." },
        { status: 429, headers: rateLimitHeaders }
      )
    }

    const auth = await requireAuth(request)
    if (!auth.success) return auth.response

    const { id } = await params
    const existing = await prisma.shop.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: "Boutique non trouvée" }, { status: 404 })
    }
    if (existing.sellerId !== auth.user.userId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
    }

    const body = await request.json()
    const validation = validateInput(shopUpdateSchema, body)
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    const shop = await prisma.shop.update({
      where: { id },
      data: validation.data,
    })

    return NextResponse.json(shop)
  } catch (error) {
    console.error("[SHOP_PUT]", error)
    return NextResponse.json({ error: "Erreur interne du serveur" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuth(request)
    if (!auth.success) return auth.response

    const { id } = await params
    const existing = await prisma.shop.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: "Boutique non trouvée" }, { status: 404 })
    }
    if (existing.sellerId !== auth.user.userId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
    }

    await prisma.shop.delete({ where: { id } })
    return NextResponse.json({ message: "Boutique supprimée" })
  } catch (error) {
    console.error("[SHOP_DELETE]", error)
    return NextResponse.json({ error: "Erreur interne du serveur" }, { status: 500 })
  }
}

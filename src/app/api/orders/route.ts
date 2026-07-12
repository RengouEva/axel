import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { validateInput, orderCreateSchema } from "@/lib/validations"
import { requireAuth } from "@/lib/require-auth"
import { generateOrderId } from "@/lib/auth-utils"
import { checkApiRateLimit, getRateLimitHeaders } from "@/lib/rate-limit"

const PAGE_SIZE = 20

export async function GET(request: Request) {
  try {
    const auth = await requireAuth(request)
    if (!auth.success) return auth.response

    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || String(PAGE_SIZE))))

    const where: Record<string, unknown> = {}
    if (auth.user.role === "client") {
      where.userId = auth.user.userId
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          items: true,
          user: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.order.count({ where }),
    ])

    return NextResponse.json({
      orders,
      total,
      page,
      pageSize: limit,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    console.error("[ORDERS_GET]", error)
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const ip = request.headers.get("x-forwarded-for") || "unknown"
    const rateLimit = checkApiRateLimit(`orders:${ip}`)
    if (!rateLimit.allowed) {
      return NextResponse.json({ error: "Trop de requêtes" }, { status: 429 })
    }

    const auth = await requireAuth(request)
    if (!auth.success) return auth.response

    const body = await request.json()
    const validation = validateInput(orderCreateSchema, body)
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    const { total, items, shipping } = validation.data

    const newOrder = await prisma.order.create({
      data: {
        id: generateOrderId(),
        date: new Date(),
        status: "pending",
        total,
        userId: auth.user.userId,
        shippingName: shipping?.name || null,
        shippingEmail: shipping?.email || null,
        shippingPhone: shipping?.telephone || null,
        shippingAddress: shipping?.address || null,
        countryId: shipping?.countryId || null,
        cityId: shipping?.cityId || null,
        districtId: shipping?.districtId || null,
        deliveryMethod: shipping?.method || null,
        items: {
          create: items.map((item) => ({
            productId: item.productId,
            name: item.name,
            quantity: item.quantity,
            price: item.price,
          })),
        },
      },
      include: { items: true },
    })

    return NextResponse.json(newOrder, { status: 201 })
  } catch (error) {
    console.error("[ORDERS_POST]", error)
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 })
  }
}

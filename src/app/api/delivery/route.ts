import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCountries, getCities, getDistricts } from "@/data/delivery"
import { validateInput, deliveryCreateSchema, deliveryAssignSchema, deliveryStatusSchema } from "@/lib/validations"
import { requireAuth, requireRole } from "@/lib/require-auth"
import { generateMissionId } from "@/lib/auth-utils"
import { checkApiRateLimit, getRateLimitHeaders } from "@/lib/rate-limit"

export async function GET(request: Request) {
  try {
    const auth = await requireAuth(request)
    if (!auth.success) return auth.response

    const ip = request.headers.get("x-forwarded-for") || "unknown"
    const rateLimit = checkApiRateLimit(`delivery:${ip}`)
    const headers = getRateLimitHeaders(rateLimit)

    if (!rateLimit.allowed) {
      return NextResponse.json({ error: "Trop de requêtes" }, { status: 429, headers })
    }

    const { searchParams } = new URL(request.url)
    const missionId = searchParams.get("mission")
    const personId = searchParams.get("person")
    const countryId = searchParams.get("country")
    const cityId = searchParams.get("city")
    const districtId = searchParams.get("district")
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20")))

    const missionWhere: Record<string, unknown> = {}
    if (missionId) missionWhere.id = missionId
    if (personId) missionWhere.deliveryPersonId = personId
    if (countryId) missionWhere.countryId = countryId
    if (cityId) missionWhere.cityId = cityId
    if (districtId) missionWhere.districtId = districtId

    const personWhere: Record<string, unknown> = {}
    if (countryId) personWhere.countryId = countryId
    if (cityId) personWhere.cityId = cityId
    if (districtId) personWhere.districtId = districtId
    if (personId) personWhere.id = personId

    const [missions, persons, totalMissions, countries, cities, districts] = await Promise.all([
      prisma.deliveryMission.findMany({
        where: missionWhere,
        include: { deliveryPerson: true },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.deliveryPerson.findMany({
        where: personWhere,
        select: {
          id: true,
          name: true,
          phone: true,
          avatar: true,
          countryId: true,
          cityId: true,
          districtId: true,
          available: true,
          rating: true,
          kycStatus: true,
          missionsCount: true,
          coordinates: true,
        },
      }),
      prisma.deliveryMission.count({ where: missionWhere }),
      getCountries(),
      getCities(),
      getDistricts(),
    ])

    return NextResponse.json({
      missions,
      persons,
      countries,
      cities,
      districts,
      total: totalMissions,
      page,
      pageSize: limit,
      totalPages: Math.ceil(totalMissions / limit),
    }, { headers })
  } catch (error) {
    console.error("[DELIVERY_GET]", error)
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const auth = await requireRole(request, ["admin", "seller"])
    if (!auth.success) return auth.response

    const ip = request.headers.get("x-forwarded-for") || "unknown"
    const rateLimit = checkApiRateLimit(`delivery-put:${ip}`)
    if (!rateLimit.allowed) {
      return NextResponse.json({ error: "Trop de requêtes" }, { status: 429 })
    }

    const body = await request.json()
    const { action, missionId, personId, status } = body

    if (action === "assign") {
      const validation = validateInput(deliveryAssignSchema, { missionId, personId })
      if (!validation.success) {
        return NextResponse.json({ error: validation.error }, { status: 400 })
      }

      const [mission, person] = await Promise.all([
        prisma.deliveryMission.findUnique({ where: { id: missionId } }),
        prisma.deliveryPerson.findUnique({ where: { id: personId } }),
      ])
      if (!mission) return NextResponse.json({ error: "Mission non trouvée" }, { status: 404 })
      if (!person) return NextResponse.json({ error: "Livreur non trouvé" }, { status: 404 })

      await prisma.deliveryMission.update({
        where: { id: missionId },
        data: { deliveryPersonId: personId, assignedAt: new Date(), status: "assigned" },
      })
      return NextResponse.json({ success: true, message: `${person.name} assigné à la mission ${mission.id}` })
    }

    if (action === "status") {
      const validation = validateInput(deliveryStatusSchema, { missionId, status })
      if (!validation.success) {
        return NextResponse.json({ error: validation.error }, { status: 400 })
      }

      await prisma.deliveryMission.update({
        where: { id: missionId },
        data: { status, completedAt: status === "delivered" ? new Date() : undefined },
      })
      return NextResponse.json({ success: true, message: `Mission ${missionId} mise à jour: ${status}` })
    }

    if (action === "toggle" && personId) {
      const person = await prisma.deliveryPerson.findUnique({ where: { id: personId } })
      if (!person) return NextResponse.json({ error: "Livreur non trouvé" }, { status: 404 })
      await prisma.deliveryPerson.update({
        where: { id: personId },
        data: { available: !person.available },
      })
      return NextResponse.json({ success: true, message: `Disponibilité de ${person.name} modifiée` })
    }

    return NextResponse.json({ error: "Action invalide" }, { status: 400 })
  } catch (error) {
    console.error("[DELIVERY_PUT]", error)
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireRole(request, ["admin", "seller"])
    if (!auth.success) return auth.response

    const ip = request.headers.get("x-forwarded-for") || "unknown"
    const rateLimit = checkApiRateLimit(`delivery-post:${ip}`)
    if (!rateLimit.allowed) {
      return NextResponse.json({ error: "Trop de requêtes" }, { status: 429 })
    }

    const body = await request.json()
    const validation = validateInput(deliveryCreateSchema, body)
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    const { orderId, countryId, cityId, districtId, deliveryAddress, customerName, customerPhone } = validation.data

    const shop = await prisma.shop.findFirst({
      where: { cityId },
      orderBy: { createdAt: "asc" },
    })
    const pickupAddress = shop
      ? `${shop.address}, ${shop.name}`
      : "Entrepôt AXEL, Douala"

    const mission = await prisma.deliveryMission.create({
      data: {
        id: generateMissionId(),
        orderId,
        countryId,
        cityId,
        districtId,
        status: "pending",
        pickupAddress,
        deliveryAddress: deliveryAddress || "",
        customerName: customerName || "",
        customerPhone: customerPhone || "",
      },
    })
    return NextResponse.json(mission, { status: 201 })
  } catch (error) {
    console.error("[DELIVERY_POST]", error)
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 })
  }
}

import { NextResponse } from "next/server"
import { queryOne, queryAll, execute } from "@/lib/db"
import { getCountries, getCities, getDistricts } from "@/data/delivery"
import { validateInput, deliveryCreateSchema, deliveryAssignSchema, deliveryStatusSchema } from "@/lib/validations"
import { requireAuth, requireRole } from "@/lib/require-auth"
import { generateMissionId } from "@/lib/auth-utils"
import { checkApiRateLimit, getRateLimitHeaders } from "@/lib/rate-limit"

export async function GET(request: Request) {
  try {
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

    const missionConditions: string[] = []
    const missionParams: unknown[] = []
    if (missionId) { missionConditions.push("m.id = ?"); missionParams.push(missionId) }
    if (personId) { missionConditions.push("m.deliveryPersonId = ?"); missionParams.push(personId) }
    if (countryId) { missionConditions.push("m.countryId = ?"); missionParams.push(countryId) }
    if (cityId) { missionConditions.push("m.cityId = ?"); missionParams.push(cityId) }
    if (districtId) { missionConditions.push("m.districtId = ?"); missionParams.push(districtId) }
    const missionWhere = missionConditions.length > 0 ? "WHERE " + missionConditions.join(" AND ") : ""

    const personConditions: string[] = []
    const personParams: unknown[] = []
    if (countryId) { personConditions.push("countryId = ?"); personParams.push(countryId) }
    if (cityId) { personConditions.push("cityId = ?"); personParams.push(cityId) }
    if (districtId) { personConditions.push("districtId = ?"); personParams.push(districtId) }
    if (personId) { personConditions.push("id = ?"); personParams.push(personId) }
    const personWhere = personConditions.length > 0 ? "WHERE " + personConditions.join(" AND ") : ""

    const [missions, persons, totalMissionsRow, countries, cities, districts] = await Promise.all([
      queryAll<any>(
        `SELECT m.*, p.id as _person_id, p.name as _person_name, p.phone as _person_phone, p.avatar as _person_avatar, p.available as _person_available, p.rating as _person_rating
         FROM DeliveryMission m LEFT JOIN DeliveryPerson p ON p.id = m.deliveryPersonId ${missionWhere} ORDER BY m.createdAt DESC LIMIT ? OFFSET ?`,
        [...missionParams, limit, (page - 1) * limit]
      ),
      queryAll<any>(
        `SELECT id, name, phone, avatar, countryId, cityId, districtId, available, rating, kycStatus, missionsCount, coordinates FROM DeliveryPerson ${personWhere}`,
        personParams
      ),
      queryOne<{ count: number }>(`SELECT COUNT(*) as count FROM DeliveryMission m ${missionWhere}`, missionParams),
      getCountries(),
      getCities(),
      getDistricts(),
    ])

    const totalMissions = totalMissionsRow?.count ?? 0

    const mappedMissions = missions.map((m: any) => {
      const deliveryPerson = m._person_id ? {
        id: m._person_id, name: m._person_name, phone: m._person_phone,
        avatar: m._person_avatar, available: m._person_available, rating: m._person_rating
      } : null
      const { _person_id, _person_name, _person_phone, _person_avatar, _person_available, _person_rating, ...rest } = m
      return { ...rest, deliveryPerson }
    })

    return NextResponse.json({
      missions: mappedMissions,
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
        queryOne<any>("SELECT * FROM DeliveryMission WHERE id = ?", [missionId]),
        queryOne<any>("SELECT * FROM DeliveryPerson WHERE id = ?", [personId]),
      ])
      if (!mission) return NextResponse.json({ error: "Mission non trouvée" }, { status: 404 })
      if (!person) return NextResponse.json({ error: "Livreur non trouvé" }, { status: 404 })

      await execute(
        "UPDATE DeliveryMission SET deliveryPersonId = ?, assignedAt = ?, status = ? WHERE id = ?",
        [personId, new Date(), "assigned", missionId]
      )
      return NextResponse.json({ success: true, message: `${person.name} assigné à la mission ${mission.id}` })
    }

    if (action === "status") {
      const validation = validateInput(deliveryStatusSchema, { missionId, status })
      if (!validation.success) {
        return NextResponse.json({ error: validation.error }, { status: 400 })
      }

      await execute(
        "UPDATE DeliveryMission SET status = ?, completedAt = ? WHERE id = ?",
        [status, status === "delivered" ? new Date() : null, missionId]
      )
      return NextResponse.json({ success: true, message: `Mission ${missionId} mise à jour: ${status}` })
    }

    if (action === "toggle" && personId) {
      const person = await queryOne<any>("SELECT * FROM DeliveryPerson WHERE id = ?", [personId])
      if (!person) return NextResponse.json({ error: "Livreur non trouvé" }, { status: 404 })
      await execute(
        "UPDATE DeliveryPerson SET available = ? WHERE id = ?",
        [person.available ? 0 : 1, personId]
      )
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

    const shop = await queryOne<any>(
      "SELECT address, name FROM Shop WHERE cityId = ? ORDER BY createdAt ASC LIMIT 1",
      [cityId]
    )
    const pickupAddress = shop
      ? `${shop.address}, ${shop.name}`
      : "Entrepôt AXEL, Douala"

    const missionId = generateMissionId()
    await execute(
      `INSERT INTO DeliveryMission (id, orderId, countryId, cityId, districtId, status, pickupAddress, deliveryAddress, customerName, customerPhone)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [missionId, orderId, countryId, cityId, districtId, "pending", pickupAddress, deliveryAddress || "", customerName || "", customerPhone || ""]
    )
    const mission = await queryOne<any>("SELECT * FROM DeliveryMission WHERE id = ?", [missionId])
    return NextResponse.json(mission, { status: 201 })
  } catch (error) {
    console.error("[DELIVERY_POST]", error)
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 })
  }
}

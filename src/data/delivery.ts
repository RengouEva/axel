import { queryAll, queryOne } from "@/lib/db"
import { cached } from "@/lib/cache"

export interface Country {
  id: string
  name: string
  flag: string
}

export interface City {
  id: string
  name: string
  countryId: string
  x: number
  y: number
}

export interface District {
  id: string
  name: string
  cityId: string
  x: number
  y: number
}

export type KycStatus = "verified" | "approved" | "pending" | "rejected"

export interface DeliveryPerson {
  id: string
  name: string
  phone: string
  email: string
  avatar: string
  location: { x: number; y: number }
  countryId: string
  cityId: string
  districtId: string
  available: boolean
  rating: number
  kycStatus: KycStatus
  missionsCount: number
}

export type MissionStatus = "pending" | "assigned" | "picked_up" | "in_transit" | "delivered" | "cancelled"

export interface DeliveryMission {
  id: string
  orderId: string
  deliveryPersonId?: string
  deliveryPerson?: DeliveryPerson
  countryId: string
  cityId: string
  districtId: string
  status: MissionStatus
  pickupAddress: string
  deliveryAddress: string
  customerName: string
  customerPhone: string
  assignedAt?: string
  completedAt?: string
}

export interface ProductStock {
  productId: number
  countryId: string
  cityId: string
  districtId: string
  quantity: number
}

export async function getCountries(): Promise<Country[]> {
  return cached("countries", () => queryAll<Country>("SELECT * FROM Country ORDER BY name ASC"), 86_400_000)
}

export async function getCities(): Promise<City[]> {
  return cached("cities", () => queryAll<City>("SELECT * FROM City ORDER BY name ASC"), 86_400_000)
}

export async function getDistricts(): Promise<District[]> {
  return cached("districts", () => queryAll<District>("SELECT * FROM District ORDER BY name ASC"), 86_400_000)
}

function parsePerson(p: any): DeliveryPerson {
  return {
    id: p.id,
    name: p.name,
    phone: p.phone,
    email: p.email,
    avatar: p.avatar,
    location: (() => {
      try { return JSON.parse(p.coordinates || "{x:0,y:0}") } catch { return { x: 0, y: 0 } }
    })(),
    countryId: p.countryId,
    cityId: p.cityId,
    districtId: p.districtId,
    available: Boolean(p.available),
    rating: p.rating,
    kycStatus: p.kycStatus as KycStatus,
    missionsCount: p.missionsCount,
  }
}

export async function getDeliveryPersons(): Promise<DeliveryPerson[]> {
  const data = await queryAll<any>("SELECT * FROM DeliveryPerson ORDER BY name ASC")
  return data.map(parsePerson)
}

function parseMission(m: any, persons?: DeliveryPerson[]): DeliveryMission {
  return {
    id: m.id,
    orderId: m.orderId,
    deliveryPersonId: m.deliveryPersonId ?? undefined,
    countryId: m.countryId,
    cityId: m.cityId,
    districtId: m.districtId,
    status: m.status as MissionStatus,
    pickupAddress: m.pickupAddress,
    deliveryAddress: m.deliveryAddress,
    customerName: m.customerName,
    customerPhone: m.customerPhone,
    assignedAt: m.assignedAt ? (typeof m.assignedAt === "string" ? m.assignedAt : m.assignedAt?.toISOString?.()) : undefined,
    completedAt: m.completedAt ? (typeof m.completedAt === "string" ? m.completedAt : m.completedAt?.toISOString?.()) : undefined,
    deliveryPerson: m.deliveryPersonId && persons
      ? persons.find(p => p.id === m.deliveryPersonId)
      : undefined,
  }
}

export async function getDeliveryMissions(): Promise<DeliveryMission[]> {
  const [missions, persons] = await Promise.all([
    queryAll<any>("SELECT * FROM DeliveryMission ORDER BY createdAt DESC"),
    getDeliveryPersons(),
  ])
  return missions.map((m: any) => parseMission(m, persons))
}

export async function getProductStocks(): Promise<ProductStock[]> {
  const data = await queryAll<any>("SELECT * FROM ProductStock")
  return data.map((s: any) => ({
    productId: s.productId,
    countryId: s.countryId,
    cityId: s.cityId,
    districtId: s.districtId,
    quantity: s.quantity,
  }))
}

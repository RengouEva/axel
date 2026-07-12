import "server-only"
import { prisma } from "@/lib/prisma"

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
  return await prisma.country.findMany({ orderBy: { name: "asc" } })
}

export async function getCities(): Promise<City[]> {
  return await prisma.city.findMany({ orderBy: { name: "asc" } })
}

export async function getDistricts(): Promise<District[]> {
  return await prisma.district.findMany({ orderBy: { name: "asc" } })
}

export async function getDeliveryPersons(): Promise<DeliveryPerson[]> {
  const persons = await prisma.deliveryPerson.findMany({ orderBy: { name: "asc" } })
  return persons.map((p: any) => ({
    id: p.id,
    name: p.name,
    phone: p.phone,
    email: p.email,
    avatar: p.avatar,
    location: JSON.parse(p.coordinates || "{x:0,y:0}"),
    countryId: p.countryId,
    cityId: p.cityId,
    districtId: p.districtId,
    available: p.available,
    rating: p.rating,
    kycStatus: p.kycStatus as KycStatus,
    missionsCount: p.missionsCount,
  }))
}

export async function getDeliveryMissions(): Promise<DeliveryMission[]> {
  const missions = await prisma.deliveryMission.findMany({
    include: { deliveryPerson: true },
    orderBy: { createdAt: "desc" },
  })
  return missions.map((m: any) => ({
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
    assignedAt: m.assignedAt?.toISOString?.() ?? undefined,
    completedAt: m.completedAt?.toISOString?.() ?? undefined,
    deliveryPerson: m.deliveryPerson ? {
      id: m.deliveryPerson.id,
      name: m.deliveryPerson.name,
      phone: m.deliveryPerson.phone,
      email: m.deliveryPerson.email,
      avatar: m.deliveryPerson.avatar,
      location: JSON.parse(m.deliveryPerson.coordinates || "{x:0,y:0}"),
      countryId: m.deliveryPerson.countryId,
      cityId: m.deliveryPerson.cityId,
      districtId: m.deliveryPerson.districtId,
      available: m.deliveryPerson.available,
      rating: m.deliveryPerson.rating,
      kycStatus: m.deliveryPerson.kycStatus as KycStatus,
      missionsCount: m.deliveryPerson.missionsCount,
    } : undefined,
  }))
}

export async function getProductStocks(): Promise<ProductStock[]> {
  const stocks = await prisma.productStock.findMany()
  return stocks.map((s: any) => ({
    productId: s.productId,
    countryId: s.countryId,
    cityId: s.cityId,
    districtId: s.districtId,
    quantity: s.quantity,
  }))
}

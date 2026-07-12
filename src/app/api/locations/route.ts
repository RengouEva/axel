import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const [countries, cities, districts] = await Promise.all([
      prisma.country.findMany({ orderBy: { name: "asc" } }),
      prisma.city.findMany({ orderBy: { name: "asc" } }),
      prisma.district.findMany({ orderBy: { name: "asc" } }),
    ])
    return NextResponse.json({ countries, cities, districts })
  } catch (error) {
    console.error("[LOCATIONS_GET]", error)
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 })
  }
}

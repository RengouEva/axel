import { NextResponse } from "next/server"
import { queryAll } from "@/lib/db"
import { ALL_COUNTRIES } from "@/data/countries"

export async function GET() {
  try {
    const [cities, districts] = await Promise.all([
      queryAll<any>("SELECT * FROM City ORDER BY name ASC"),
      queryAll<any>("SELECT * FROM District ORDER BY name ASC"),
    ])
    return NextResponse.json({ countries: ALL_COUNTRIES, cities, districts })
  } catch (error) {
    console.error("[LOCATIONS_GET]", error)
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 })
  }
}

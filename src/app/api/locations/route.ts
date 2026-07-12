import { NextResponse } from "next/server"
import { queryAll } from "@/lib/db"

export async function GET() {
  try {
    const [countries, cities, districts] = await Promise.all([
      queryAll<any>("SELECT * FROM Country ORDER BY name ASC"),
      queryAll<any>("SELECT * FROM City ORDER BY name ASC"),
      queryAll<any>("SELECT * FROM District ORDER BY name ASC"),
    ])
    return NextResponse.json({ countries, cities, districts })
  } catch (error) {
    console.error("[LOCATIONS_GET]", error)
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 })
  }
}

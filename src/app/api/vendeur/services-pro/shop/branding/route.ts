import { NextResponse } from "next/server"
import { requireRole } from "@/lib/require-auth"
import { queryOne } from "@/lib/db"
import { validateInput, shopSettingsSchema } from "@/lib/services-pro-validations"
import { getShopSettings, upsertShopSettings, updateShopBranding } from "@/data/services-pro/shop"
import type { ShopSettings } from "@/lib/services-pro-types"

export async function GET(request: Request) {
  try {
    const auth = await requireRole(request, ["seller", "admin"])
    if (!auth.success) return auth.response

    const shop = await queryOne<any>("SELECT * FROM Shop WHERE sellerId = ?", [auth.user.userId])
    if (!shop) return NextResponse.json({ error: "Boutique introuvable" }, { status: 404 })

    const [settings, shopData] = await Promise.all([
      getShopSettings(shop.id),
      queryOne<any>("SELECT * FROM Shop WHERE id = ?", [shop.id]),
    ])

    return NextResponse.json({ shop: shopData, settings: settings || {} })
  } catch (error) {
    console.error("[SERVICES_PRO_BRANDING_GET]", error)
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const auth = await requireRole(request, ["seller", "admin"])
    if (!auth.success) return auth.response

    const shop = await queryOne<any>("SELECT * FROM Shop WHERE sellerId = ?", [auth.user.userId])
    if (!shop) return NextResponse.json({ error: "Boutique introuvable" }, { status: 404 })

    const body = await request.json()
    const { logo, coverImage, name, description, phone, email, settings } = body

    if (logo || coverImage || name || description !== undefined || phone || email) {
      await updateShopBranding(shop.id, { logo, coverImage, name, description, phone, email })
    }

    if (settings) {
      const validation = validateInput(shopSettingsSchema, settings)
      if (!validation.success) {
        return NextResponse.json({ error: validation.error }, { status: 400 })
      }
      await upsertShopSettings(shop.id, validation.data as Partial<ShopSettings>)
    }

    return NextResponse.json({ message: "Boutique mise à jour" })
  } catch (error) {
    console.error("[SERVICES_PRO_BRANDING_PUT]", error)
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 })
  }
}

import { NextResponse } from "next/server"
import { requireRole } from "@/lib/require-auth"
import { queryOne } from "@/lib/db"
import { validateInput, securitySettingsSchema } from "@/lib/services-pro-validations"
import { getSecuritySettings, upsertSecuritySettings, logAction } from "@/data/services-pro/security"
import crypto from "crypto"

export async function GET(request: Request) {
  try {
    const auth = await requireRole(request, ["seller", "admin"])
    if (!auth.success) return auth.response

    const shop = await queryOne<any>("SELECT * FROM Shop WHERE sellerId = ?", [auth.user.userId])
    if (!shop) return NextResponse.json({ error: "Boutique introuvable" }, { status: 404 })

    const security = await getSecuritySettings(shop.id)
    return NextResponse.json({ security: security || { twoFactorEnabled: false, twoFactorMethod: 'app', sessionTimeout: 60 } })
  } catch (error) {
    console.error("[SERVICES_PRO_SECURITY_GET]", error)
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
    const validation = validateInput(securitySettingsSchema, body)
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    const data: any = { ...validation.data }
    if (data.twoFactorEnabled && !data.twoFactorSecret) {
      data.twoFactorSecret = crypto.randomBytes(20).toString('hex')
      const codes: string[] = []
      for (let i = 0; i < 8; i++) {
        codes.push(crypto.randomBytes(4).toString('hex').toUpperCase())
      }
      data.backupCodes = codes
    }

    await upsertSecuritySettings(shop.id, data)
    await logAction(shop.id, auth.user.userId, {
      action: 'update_security_settings',
      entityType: 'security',
      details: { twoFactorEnabled: data.twoFactorEnabled },
    })

    const response: any = { message: "Paramètres de sécurité mis à jour" }
    if (data.backupCodes) {
      response.backupCodes = data.backupCodes
      response.warning = "Conservez ces codes de récupération. Ils ne seront plus jamais affichés."
    }
    if (data.twoFactorSecret) {
      response.secret = data.twoFactorSecret
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error("[SERVICES_PRO_SECURITY_PUT]", error)
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 })
  }
}

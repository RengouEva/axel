import { NextResponse } from "next/server"
import { queryOne, execute } from "@/lib/db"
import { checkAuthRateLimit, getRateLimitHeaders } from "@/lib/rate-limit"
import crypto from "crypto"

export async function POST(request: Request) {
  try {
    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown"
    const rateLimit = checkAuthRateLimit(`forgot:${ip}`)
    const rateLimitHeaders = getRateLimitHeaders(rateLimit)

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Trop de tentatives. Veuillez réessayer plus tard." },
        { status: 429, headers: rateLimitHeaders }
      )
    }

    const { email } = await request.json()
    if (!email) {
      return NextResponse.json({ error: "Email requis" }, { status: 400 })
    }

    const user = await queryOne<any>("SELECT id, email FROM User WHERE email = ?", [email])
    if (!user) {
      return NextResponse.json(
        { error: "Aucun compte trouvé avec cet email" },
        { status: 404, headers: rateLimitHeaders }
      )
    }

    const token = crypto.randomBytes(32).toString("hex")
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000)

    await execute(
      "INSERT INTO PasswordReset (userId, token, expiresAt) VALUES (?, ?, ?)",
      [user.id, token, expiresAt]
    )

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
    const resetLink = `${siteUrl}/reinitialiser-mot-de-passe?token=${token}`

    console.log(`[PASSWORD_RESET] Lien pour ${email}: ${resetLink}`)

    return NextResponse.json({
      success: true,
      message: "Si un compte existe avec cet email, un lien de réinitialisation a été envoyé.",
    }, { headers: rateLimitHeaders })
  } catch (error) {
    console.error("[FORGOT_PASSWORD]", error)
    return NextResponse.json({ error: "Erreur interne du serveur" }, { status: 500 })
  }
}

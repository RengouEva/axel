import { NextResponse } from "next/server"
import { queryOne, execute } from "@/lib/db"
import { hashPassword, verifyPassword, createToken } from "@/lib/auth-utils"
import { validateInput, loginSchema, registerSchema } from "@/lib/validations"
import { checkAuthRateLimit, getRateLimitHeaders } from "@/lib/rate-limit"

export async function POST(request: Request) {
  try {
    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown"
    const rateLimit = checkAuthRateLimit(ip)
    const rateLimitHeaders = getRateLimitHeaders(rateLimit)

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Trop de tentatives. Veuillez réessayer plus tard." },
        { status: 429, headers: rateLimitHeaders }
      )
    }

    const body = await request.json()
    const { action, email, password, name, role } = body

    if (action === "login") {
      const validation = validateInput(loginSchema, { email, password })
      if (!validation.success) {
        return NextResponse.json({ error: validation.error }, { status: 400 })
      }

      const user = await queryOne<any>("SELECT * FROM User WHERE email = ?", [email])
      if (!user) {
        return NextResponse.json({ error: "Email ou mot de passe incorrect" }, { status: 401 })
      }

      const isValidPassword = await verifyPassword(password, user.password)
      if (!isValidPassword) {
        return NextResponse.json({ error: "Email ou mot de passe incorrect" }, { status: 401 })
      }

      const token = await createToken({
        userId: user.id,
        email: user.email,
        role: user.role,
      })

      const { password: _, ...safeUser } = user
      const response = NextResponse.json({ user: safeUser, token })
      response.cookies.set("axel-token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60,
        path: "/",
      })
      return response
    }

    if (action === "register") {
      const validation = validateInput(registerSchema, { name, email, password, role })
      if (!validation.success) {
        return NextResponse.json({ error: validation.error }, { status: 400 })
      }

      const existing = await queryOne<any>("SELECT id FROM User WHERE email = ?", [email])
      if (existing) {
        return NextResponse.json({ error: "Cet email est déjà utilisé" }, { status: 409 })
      }

      const hashedPassword = await hashPassword(password)
      const userRole = validation.data.role || "client"

      const result = await execute(
        "INSERT INTO User (name, email, password, role) VALUES (?, ?, ?, ?)",
        [name, email, hashedPassword, userRole]
      )
      const newUser = await queryOne<any>("SELECT * FROM User WHERE id = ?", [result.insertId])

      const token = await createToken({
        userId: newUser.id,
        email: newUser.email,
        role: newUser.role,
      })

      const { password: _, ...safeUser } = newUser
      const response = NextResponse.json({ user: safeUser, token }, { status: 201 })
      response.cookies.set("axel-token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60,
        path: "/",
      })
      return response
    }

    return NextResponse.json({ error: "Action non valide" }, { status: 400 })
  } catch (error) {
    console.error("[AUTH_ERROR]", error)
    return NextResponse.json({ error: "Erreur interne du serveur" }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    message: "AXEL Auth API",
    version: "2.0",
    endpoints: {
      login: "POST /api/auth { action: 'login', email, password }",
      register: "POST /api/auth { action: 'register', email, password, name }",
    },
  })
}

import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { jwtVerify } from "jose"

function getJwtSecret(): Uint8Array | null {
  const secret = process.env.JWT_SECRET
  if (!secret) return null
  return new TextEncoder().encode(secret)
}

const PUBLIC_ROUTES = [
  "/",
  "/debug",
  "/produits",
  "/produit",
  "/categorie",
  "/promotions",
  "/nouveautes",
  "/a-credit",
  "/comparateur",
  "/marques",
  "/blog",
  "/faq",
  "/contact",
  "/a-propos",
  "/livraison",
  "/cgu",
  "/confidentialite",
  "/connexion",
  "/inscription",
  "/mot-de-passe-oublie",
]

const API_PUBLIC_ROUTES = [
  "/api/auth",
  "/api/categories",
  "/api/credit",
  "/api/debug",
  "/api/locations",
  "/api/products",
  "/api/search",
  "/api/setup",
  "/api/shops",
  "/api/taxes",
  "/api/upload",
  "/api/plans",
  "/api/delivery",
  "/api/organic",
  "/api/ads/serve",
]

const API_READ_ROUTES: string[] = []

function isPublicRoute(pathname: string): boolean {
  if (pathname === "/") return true
  return PUBLIC_ROUTES.some((route) => pathname.startsWith(route))
}

function isApiPublicRoute(pathname: string): boolean {
  return API_PUBLIC_ROUTES.some((route) => pathname.startsWith(route))
}

function isApiReadRoute(pathname: string): boolean {
  return API_READ_ROUTES.some((route) => pathname.startsWith(route))
}

function isAdminRoute(pathname: string): boolean {
  return pathname.startsWith("/admin")
}

function isSellerRoute(pathname: string): boolean {
  return pathname.startsWith("/vendeur")
}

function isAccountRoute(pathname: string): boolean {
  return pathname.startsWith("/compte")
}

async function verifyAuthToken(token: string): Promise<{
  userId: number
  email: string
  role: string
} | null> {
  const secret = getJwtSecret()
  if (!secret) return null
  try {
    const { payload } = await jwtVerify(token, secret, {
      issuer: "axel-marketplace",
    })
    return {
      userId: payload.userId as number,
      email: payload.email as string,
      role: payload.role as string,
    }
  } catch {
    return null
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname.startsWith("/_next") || pathname.startsWith("/favicon") || pathname.includes(".")) {
    return NextResponse.next()
  }

  if (pathname.startsWith("/api/")) {
    if (isApiPublicRoute(pathname)) {
      return NextResponse.next()
    }

    if (isApiReadRoute(pathname) && request.method === "GET") {
      return NextResponse.next()
    }

    const authHeader = request.headers.get("authorization")
    const token = authHeader?.replace("Bearer ", "")
    if (!token) {
      return NextResponse.json({ error: "Token d'authentification requis" }, { status: 401 })
    }

    const user = await verifyAuthToken(token)
    if (!user) {
      return NextResponse.json({ error: "Token invalide ou expiré" }, { status: 401 })
    }

    const requestHeaders = new Headers(request.headers)
    requestHeaders.set("x-user-id", String(user.userId))
    requestHeaders.set("x-user-email", user.email)
    requestHeaders.set("x-user-role", user.role)

    return NextResponse.next({
      request: { headers: requestHeaders },
    })
  }

  if (isAdminRoute(pathname) || isSellerRoute(pathname) || isAccountRoute(pathname)) {
    const token = request.cookies.get("axel-token")?.value
    if (!token) {
      const loginUrl = new URL("/connexion", request.url)
      loginUrl.searchParams.set("redirect", pathname)
      return NextResponse.redirect(loginUrl)
    }

    const user = await verifyAuthToken(token)
    if (!user) {
      const response = NextResponse.redirect(new URL("/connexion", request.url))
      response.cookies.delete("axel-token")
      return response
    }

    if (isAdminRoute(pathname) && user.role !== "admin") {
      return NextResponse.redirect(new URL("/", request.url))
    }

    if (isSellerRoute(pathname) && user.role !== "seller" && user.role !== "admin") {
      return NextResponse.redirect(new URL("/", request.url))
    }
  }

  if (isPublicRoute(pathname)) {
    return NextResponse.next()
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icons/|images/|sw.js|manifest.json).*)",
  ],
}

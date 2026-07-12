import { verifyToken } from "@/lib/auth-utils"

export interface AuthUser {
  userId: number
  email: string
  role: string
}

export async function requireAuth(request: Request): Promise<
  | { success: true; user: AuthUser }
  | { success: false; response: Response }
> {
  const authHeader = request.headers.get("authorization")
  const token = authHeader?.replace("Bearer ", "")

  if (!token) {
    return {
      success: false,
      response: Response.json(
        { error: "Authentification requise" },
        { status: 401 }
      ),
    }
  }

  const user = await verifyToken(token)
  if (!user) {
    return {
      success: false,
      response: Response.json(
        { error: "Token invalide ou expiré" },
        { status: 401 }
      ),
    }
  }

  return { success: true, user }
}

export async function requireRole(
  request: Request,
  allowedRoles: string[]
): Promise<
  | { success: true; user: AuthUser }
  | { success: false; response: Response }
> {
  const auth = await requireAuth(request)
  if (!auth.success) return auth

  if (!allowedRoles.includes(auth.user.role)) {
    return {
      success: false,
      response: Response.json(
        { error: "Accès non autorisé" },
        { status: 403 }
      ),
    }
  }

  return auth
}

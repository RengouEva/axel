"use client"

import { createContext, useContext, useState, useEffect, useCallback, useMemo, type ReactNode } from "react"
import { useLocalStorage } from "@/lib/use-local-storage"

export interface AuthUser {
  id: number
  name: string
  email: string
  role: "client" | "seller" | "admin"
}

interface AuthContextType {
  user: AuthUser | null
  token: string | null
  loading: boolean
  login: (email: string, password: string) => Promise<string | null>
  register: (name: string, email: string, password: string, role?: "client" | "seller") => Promise<string | null>
  logout: () => void
  getAuthHeaders: () => Record<string, string>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useLocalStorage<AuthUser | null>("axel-user", null)
  const [token, setToken] = useLocalStorage<string | null>("axel-token", null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(false)
  }, [])

  const login = useCallback(async (email: string, password: string): Promise<string | null> => {
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "login", email, password }),
      })
      const data = await res.json()
      if (!res.ok) return data.error || "Erreur de connexion"
      setUser(data.user)
      setToken(data.token)
      return null
    } catch {
      return "Erreur réseau. Veuillez réessayer."
    }
  }, [setUser, setToken])

  const register = useCallback(async (name: string, email: string, password: string, role: "client" | "seller" = "client"): Promise<string | null> => {
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "register", name, email, password, role }),
      })
      const data = await res.json()
      if (!res.ok) return data.error || "Erreur d'inscription"
      setUser(data.user)
      setToken(data.token)
      return null
    } catch {
      return "Erreur réseau. Veuillez réessayer."
    }
  }, [setUser, setToken])

  const logout = useCallback(() => {
    setUser(null)
    setToken(null)
  }, [setUser, setToken])

  const getAuthHeaders = useCallback((): Record<string, string> => {
    const currentToken = token || localStorage.getItem("axel-token")
    return currentToken ? { Authorization: `Bearer ${currentToken}` } : {}
  }, [token])

  const value = useMemo(
    () => ({ user, token, loading, login, register, logout, getAuthHeaders }),
    [user, token, loading, login, register, logout, getAuthHeaders]
  )

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}

"use client"

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react"

interface ThemeContextType {
  isDark: boolean
  toggle: () => void
  setDark: (dark: boolean) => void
}

const ThemeContext = createContext<ThemeContextType>({
  isDark: false,
  toggle: () => {},
  setDark: () => {},
})

function getInitial(): boolean {
  if (typeof window === "undefined") return false
  const saved = localStorage.getItem("theme")
  if (saved === "dark") return true
  if (saved === "light") return false
  return window.matchMedia("(prefers-color-scheme: dark)").matches
}

function apply(dark: boolean) {
  document.documentElement.classList.toggle("dark", dark)
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [isDark, setIsDark] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const v = getInitial()
    setIsDark(v)
    apply(v)
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return
    apply(isDark)
    localStorage.setItem("theme", isDark ? "dark" : "light")
  }, [isDark, mounted])

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)")
    const handler = (e: MediaQueryListEvent) => {
      if (!localStorage.getItem("theme")) setIsDark(e.matches)
    }
    mq.addEventListener("change", handler)
    return () => mq.removeEventListener("change", handler)
  }, [])

  const toggle = useCallback(() => setIsDark((p) => !p), [])
  const setDark = useCallback((d: boolean) => setIsDark(d), [])

  return (
    <ThemeContext.Provider value={{ isDark: mounted ? isDark : false, toggle, setDark }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}

"use client"

import type { ReactNode } from "react"
import { Toaster } from "react-hot-toast"
import { ThemeProvider } from "@/lib/theme-context"
import { AuthProvider } from "@/lib/auth-context"
import { CartProvider } from "@/lib/cart-context"
import { CompareProvider } from "@/lib/compare-context"
import { FavoritesProvider } from "@/lib/favorites-context"
import { NotificationProvider } from "@/lib/notification-context"
import { DeliveryProvider } from "@/lib/delivery-context"

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <DeliveryProvider>
          <NotificationProvider>
            <CartProvider>
              <CompareProvider>
                <FavoritesProvider>
                  {children}
                </FavoritesProvider>
              </CompareProvider>
            </CartProvider>
          </NotificationProvider>
        </DeliveryProvider>
      </AuthProvider>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: "var(--bg-card)",
            color: "var(--text-primary)",
            border: "2px solid var(--border)",
            borderRadius: "1rem",
            fontSize: "0.875rem",
          },
          success: {
            iconTheme: { primary: "#16a34a", secondary: "#fff" },
          },
          error: {
            iconTheme: { primary: "#dc2626", secondary: "#fff" },
          },
        }}
      />
    </ThemeProvider>
  )
}

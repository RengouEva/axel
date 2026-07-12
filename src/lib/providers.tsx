"use client"

import type { ReactNode } from "react"
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
    </ThemeProvider>
  )
}

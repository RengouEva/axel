"use client"

import { createContext, useContext, useCallback, useMemo, type ReactNode } from "react"
import { useLocalStorage } from "@/lib/use-local-storage"

export interface Notification {
  id: number
  title: string
  message: string
  type: "order" | "credit" | "promo" | "system"
  read: boolean
  date: string
}

interface NotificationContextType {
  notifications: Notification[]
  unreadCount: number
  addNotification: (notif: Omit<Notification, "id" | "read" | "date">) => void
  markAsRead: (id: number) => void
  markAllAsRead: () => void
  clearAll: () => void
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)
const STORAGE_KEY = "axel-notifications"

const defaults: Notification[] = [
  { id: 1, title: "Commande confirmée", message: "Votre commande #AXEL-2024 a été confirmée.", type: "order", read: false, date: "Il y a 5 min" },
  { id: 2, title: "Crédit approuvé", message: "Votre demande de crédit a été approuvée.", type: "credit", read: false, date: "Il y a 2h" },
  { id: 3, title: "Promotion spéciale", message: "Jusqu'à -30% sur l'électroménager.", type: "promo", read: false, date: "Il y a 1 jour" },
  { id: 4, title: "Livraison en cours", message: "Votre colis est en cours de livraison.", type: "order", read: true, date: "Il y a 2 jours" },
  { id: 5, title: "Paiement accepté", message: "Votre paiement du 15 mars a été accepté.", type: "credit", read: true, date: "Il y a 3 jours" },
]

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useLocalStorage<Notification[]>(STORAGE_KEY, defaults)

  const addNotification = useCallback((notif: Omit<Notification, "id" | "read" | "date">) => {
    setNotifications((prev) => [{
      ...notif,
      id: Date.now(),
      read: false,
      date: "À l'instant",
    }, ...prev])
  }, [setNotifications])

  const markAsRead = useCallback((id: number) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
  }, [setNotifications])

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }, [setNotifications])

  const clearAll = useCallback(() => setNotifications([]), [setNotifications])

  const unreadCount = useMemo(() => notifications.filter((n) => !n.read).length, [notifications])

  const value = useMemo(
    () => ({ notifications, unreadCount, addNotification, markAsRead, markAllAsRead, clearAll }),
    [notifications, unreadCount, addNotification, markAsRead, markAllAsRead, clearAll]
  )

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  const ctx = useContext(NotificationContext)
  if (!ctx) throw new Error("useNotifications must be used within a NotificationProvider")
  return ctx
}

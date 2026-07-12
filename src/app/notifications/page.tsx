"use client"

import { ArrowLeft, Bell, CheckCheck, Trash2, CreditCard, Package, Tag, Info } from "lucide-react"
import Button from "@/components/ui/button"
import { useNotifications } from "@/lib/notification-context"
import { AnimatedDiv } from "@/lib/animations"
import Link from "next/link"

const typeIcons: Record<string, React.ElementType> = {
  order: Package,
  credit: CreditCard,
  promo: Tag,
  system: Info,
}

const typeColors: Record<string, string> = {
  order: "#1769F2",
  credit: "#0B4FC8",
  promo: "#ef4444",
  system: "#64748B",
}

export default function NotificationsPage() {
  const { notifications, markAsRead, markAllAsRead, clearAll } = useNotifications()

  return (
    <div className="w-full min-h-screen bg-[var(--bg-primary)]">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/" className="p-2 rounded-xl hover:bg-[var(--bg-secondary)] transition-colors"><ArrowLeft className="w-5 h-5 text-[var(--text-secondary)]" /></Link>
            <div>
              <h1 className="text-4xl font-bold text-[var(--text-primary)]">Notifications</h1>
              <p className="text-[var(--text-secondary)] text-sm">{notifications.filter(n => !n.read).length} non lues</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={markAllAsRead}><CheckCheck className="w-4 h-4" /> Tout marquer lu</Button>
            <Button variant="ghost" size="sm" onClick={clearAll}><Trash2 className="w-4 h-4" /> Tout effacer</Button>
          </div>
        </div>

        <div className="space-y-3">
          {notifications.length === 0 ? (
            <div className="text-center py-12">
              <Bell className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-4" />
              <p className="text-[var(--text-secondary)]">Aucune notification</p>
            </div>
          ) : (
            notifications.map((notif, i) => {
              const Icon = typeIcons[notif.type] || Info
              const color = typeColors[notif.type] || "#64748B"
              return (
                <AnimatedDiv
                  key={notif.id}
                  fade
                  slideUp
                  delay={i * 0.03}
                  onClick={() => markAsRead(notif.id)}
                  className={`flex items-start gap-4 p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                    notif.read ? "border-[var(--border)]" : "border-[var(--border-hover)]/30 bg-[var(--text-link)]/5"
                  }`}
                >
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${color}15` }}>
                    <Icon className="w-5 h-5" style={{ color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`text-sm ${notif.read ? "text-[var(--text-primary)]" : "font-semibold text-[var(--text-primary)]"}`}>{notif.title}</p>
                      {!notif.read && <div className="w-2 h-2 rounded-full bg-[var(--text-link)] shrink-0 mt-1.5" />}
                    </div>
                    <p className="text-xs text-[var(--text-secondary)] mt-0.5">{notif.message}</p>
                    <p className="text-[10px] text-[var(--text-secondary)] mt-1">{notif.date}</p>
                  </div>
                </AnimatedDiv>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}

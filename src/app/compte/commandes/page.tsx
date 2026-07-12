"use client"

import { Package, ChevronRight, ArrowLeft, MapPin } from "lucide-react"
import Button from "@/components/ui/button"
import Badge from "@/components/ui/badge"
import { AnimatedDiv } from "@/lib/animations"
import { useAuth } from "@/lib/auth-context"
import { getCities, getDistricts, type City, type District } from "@/data/delivery"
import Link from "next/link"
import { useState, useEffect } from "react"

interface OrderItem {
  id: number
  name: string
  quantity: number
  price: number
}

interface Order {
  id: string
  date: string
  status: string
  total: number
  items: OrderItem[]
  shippingName?: string
  shippingEmail?: string
  shippingAddress?: string
  countryId?: string
  cityId?: string
  districtId?: string
}

const statusColors: Record<string, "promo" | "stock" | "credit"> = {
  delivered: "stock",
  pending: "credit",
  processing: "promo",
  shipped: "credit",
}

const statusLabels: Record<string, string> = {
  delivered: "Livré",
  pending: "En attente",
  processing: "En cours",
  shipped: "Expédié",
}

export default function OrdersPage() {
  const { user } = useAuth()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [cities, setCities] = useState<City[]>([])
  const [districts, setDistricts] = useState<District[]>([])

  useEffect(() => {
    Promise.all([
      fetch("/api/orders").then((r) => r.json()),
      getCities(),
      getDistricts(),
    ]).then(([data, ci, di]) => {
      setOrders(data.orders || [])
      setCities(ci)
      setDistricts(di)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const getCityName = (id?: string) => id ? cities.find((c) => c.id === id)?.name || id : ""
  const getDistrictName = (id?: string) => id ? districts.find((d) => d.id === id)?.name || id : ""

  const userOrders = orders.filter((o) => !user || o.shippingEmail === user.email).slice(0, 10)

  return (
    <div className="w-full min-h-screen bg-[var(--bg-primary)]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/compte" className="p-2 rounded-xl hover:bg-[var(--bg-secondary)] transition-colors"><ArrowLeft className="w-5 h-5 text-[var(--text-secondary)]" /></Link>
          <h1 className="text-4xl font-bold text-[var(--text-primary)]">Mes commandes</h1>
        </div>

        {loading ? (
          <div className="text-center py-12"><p className="text-[var(--text-secondary)]">Chargement...</p></div>
        ) : userOrders.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-4" />
            <p className="text-[var(--text-secondary)] mb-4">Aucune commande pour le moment</p>
            <Link href="/produits"><Button>Découvrir les produits</Button></Link>
          </div>
        ) : (
          <div className="space-y-4">
            {userOrders.map((order, i) => {
              const firstItem = order.items?.[0]
              return (
                <Link key={order.id} href={`/compte/commandes/${order.id}`} className="block">
                  <AnimatedDiv fade slideUp delay={i * 0.05} className="p-5 rounded-2xl border-2 border-[var(--border)] hover:shadow-axel-lg hover:border-[var(--border-hover)]/30 transition-all">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-[var(--bg-secondary)] flex items-center justify-center"><Package className="w-5 h-5 text-[var(--text-link)]" /></div>
                        <div>
                          <p className="font-semibold text-[var(--text-primary)]">{firstItem?.name || "Commande"}{order.items?.length > 1 ? ` +${order.items.length - 1} article(s)` : ""}</p>
                          <p className="text-xs text-[var(--text-secondary)]">{order.id}</p>
                          <p className="text-xs text-[var(--text-secondary)] flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3" />
                            {getDistrictName(order.districtId)}, {getCityName(order.cityId)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-[var(--text-primary)]">{order.total.toLocaleString("fr-FR")} F</p>
                        <Badge variant={statusColors[order.status] || "default"}>{statusLabels[order.status] || order.status}</Badge>
                      </div>
                    </div>
                  </AnimatedDiv>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

"use client"

import { useParams } from "next/navigation"
import { Package, ArrowLeft, MapPin, CreditCard, Truck, CheckCircle, Clock } from "lucide-react"
import Button from "@/components/ui/button"
import Badge from "@/components/ui/badge"
import Link from "next/link"

const orders = [
  { id: "AXEL-2024-001", date: "15 Juin 2026", status: "Livré", total: "1 599 000 F", items: 1, product: "iPhone 16 Pro Max", image: "/images/products/iphone-16-pro-max.svg", address: "Abidjan, Cocody, Riviera 3", payment: "Carte bancaire", delivery: "Standard (48h)" },
  { id: "AXEL-2024-002", date: "20 Juin 2026", status: "En cours", total: "899 000 F", items: 1, product: "PlayStation 6 Pro", image: "/images/products/playstation-6-pro.svg", address: "Abidjan, Plateau", payment: "Crédit AXEL", delivery: "Express (24h)" },
  { id: "AXEL-2024-003", date: "25 Juin 2026", status: "Traitement", total: "299 000 F", items: 1, product: "AirPods Pro 3", image: "/images/products/airpods-pro-3.svg", address: "Dakar, Almadies", payment: "Carte bancaire", delivery: "Standard (48h)" },
]

const statusColors: Record<string, "promo" | "stock" | "credit"> = {
  "Livré": "stock",
  "En cours": "credit",
  "Traitement": "promo",
}

const steps: Record<string, { label: string; date: string }[]> = {
  "Livré": [
    { label: "Commande confirmée", date: "15 Juin 2026" },
    { label: "Préparation en cours", date: "15 Juin 2026" },
    { label: "Expédié", date: "16 Juin 2026" },
    { label: "Livré", date: "17 Juin 2026" },
  ],
  "En cours": [
    { label: "Commande confirmée", date: "20 Juin 2026" },
    { label: "Préparation en cours", date: "20 Juin 2026" },
    { label: "Expédié", date: "21 Juin 2026" },
  ],
  "Traitement": [
    { label: "Commande confirmée", date: "25 Juin 2026" },
    { label: "Préparation en cours", date: "25 Juin 2026" },
  ],
}

export default function OrderDetailPage() {
  const params = useParams()
  const id = params.id as string
  const order = orders.find(o => o.id === id)

  if (!order) {
    return (
      <div className="w-full min-h-screen bg-[var(--bg-primary)] flex items-center justify-center py-20">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">Commande introuvable</h1>
          <Link href="/compte/commandes"><Button variant="outline">Voir mes commandes</Button></Link>
        </div>
      </div>
    )
  }

  const timeline = steps[order.status] || []

  return (
    <div className="w-full min-h-screen bg-[var(--bg-primary)]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/compte/commandes" className="p-2 rounded-xl hover:bg-[var(--bg-secondary)] transition-colors"><ArrowLeft className="w-5 h-5 text-[var(--text-secondary)]" /></Link>
          <div>
            <h1 className="text-4xl font-bold text-[var(--text-primary)]">Détail de la commande</h1>
            <p className="text-sm text-[var(--text-secondary)]">{order.id}</p>
          </div>
        </div>

        <div className="grid gap-6">
          <div className="p-6 rounded-2xl border-2 border-[var(--border)]">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-xl bg-[var(--bg-secondary)] overflow-hidden">
                  <img src={order.image} alt={order.product} className="w-full h-full object-cover" />
                </div>
                <div>
                  <h3 className="font-semibold text-[var(--text-primary)]">{order.product}</h3>
                  <p className="text-sm text-[var(--text-secondary)]">{order.date}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-[var(--text-primary)]">{order.total}</p>
                <Badge variant={statusColors[order.status]}>{order.status}</Badge>
              </div>
            </div>
          </div>

          {order.status === "Livré" && (
            <div className="p-6 rounded-2xl border-2 border-[var(--border)]">
              <h3 className="font-semibold text-[var(--text-primary)] mb-2 flex items-center gap-2">
                <Truck className="w-5 h-5 text-[var(--text-link)]" /> Suivi de livraison
              </h3>
              <p className="text-sm text-[var(--text-secondary)] mb-4">Colis livré avec succès</p>
              <div className="flex items-center gap-2 text-sm text-green-600 font-semibold">
                <CheckCircle className="w-4 h-4" /> Livré le 17 Juin 2026
              </div>
            </div>
          )}

          <div className="p-6 rounded-2xl border-2 border-[var(--border)]">
            <h3 className="font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-[var(--text-link)]" /> Suivi de la commande
            </h3>
            <div className="relative pl-6 border-l-2 border-[var(--border-hover)]/30 space-y-6">
              {timeline.map((step, i) => (
                <div key={i} className="relative">
                  <div className={`absolute -left-[25px] w-4 h-4 rounded-full border-2 ${i === timeline.length - 1 ? "bg-[var(--text-link)] border-[var(--border-hover)]" : "bg-[var(--bg-primary)] border-[var(--border-hover)]"}`} />
                  <p className="font-semibold text-[var(--text-primary)] text-sm">{step.label}</p>
                  <p className="text-xs text-[var(--text-secondary)]">{step.date}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-6">
            <div className="p-6 rounded-2xl border-2 border-[var(--border)]">
              <h3 className="font-semibold text-[var(--text-primary)] mb-2 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-[var(--text-link)]" /> Adresse de livraison
              </h3>
              <p className="text-sm text-[var(--text-secondary)]">{order.address}</p>
            </div>
            <div className="p-6 rounded-2xl border-2 border-[var(--border)]">
              <h3 className="font-semibold text-[var(--text-primary)] mb-2 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-[var(--text-link)]" /> Paiement
              </h3>
              <p className="text-sm text-[var(--text-secondary)]">{order.payment}</p>
              <p className="text-sm text-[var(--text-secondary)]">{order.delivery}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
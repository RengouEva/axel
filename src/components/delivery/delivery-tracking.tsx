"use client"

import { Package, MapPin, Phone, User, Clock, CheckCircle, ShieldCheck, Store } from "lucide-react"
import type { DeliveryMission, DeliveryPerson, City, District } from "@/data/delivery"
import DeliveryMap from "./delivery-map"

interface DeliveryTrackingProps {
  mission: DeliveryMission
  persons: DeliveryPerson[]
  cities: City[]
  districts: District[]
}

const statusConfig = {
  pending: { label: "En attente", color: "#F59E0B", bg: "bg-amber-50 text-amber-700" },
  assigned: { label: "Attribué", color: "#1769F2", bg: "bg-blue-50 text-blue-700" },
  picked_up: { label: "Récupéré", color: "#8B5CF6", bg: "bg-purple-50 text-purple-700" },
  in_transit: { label: "En transit", color: "#10B981", bg: "bg-green-50 text-green-700" },
  delivered: { label: "Livré", color: "#059669", bg: "bg-green-100 text-green-800" },
  cancelled: { label: "Annulé", color: "#EF4444", bg: "bg-red-50 text-red-700" },
}

const timelineSteps = [
  { key: "pending", label: "Commande confirmée" },
  { key: "assigned", label: "Livreur attribué" },
  { key: "picked_up", label: "Colis récupéré" },
  { key: "in_transit", label: "En cours de livraison" },
  { key: "delivered", label: "Livré" },
] as const

export default function DeliveryTracking({ mission, persons, cities, districts }: DeliveryTrackingProps) {
  const deliveryPerson = persons.find((p) => p.id === mission.deliveryPersonId)
  const statusInfo = statusConfig[mission.status]
  const stepIndex = timelineSteps.findIndex((s) => s.key === mission.status)

  return (
    <div className="space-y-6">
      <div className="grid lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3">
          <DeliveryMap
            cities={cities}
            districts={districts}
            persons={deliveryPerson ? [deliveryPerson] : []}
            missions={[mission]}
            selectedCityId={mission.cityId}
          />
        </div>

        <div className="lg:col-span-2 space-y-4">
          <div className="bg-[var(--bg-primary)] rounded-2xl border-2 border-[var(--border)] p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-[var(--text-primary)]">Statut</h3>
              <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${statusInfo.bg}`}>
                {statusInfo.label}
              </span>
            </div>

            <div className="relative pl-6 space-y-0">
              {timelineSteps.map((step, i) => {
                const isDone = i <= stepIndex
                const isCurrent = i === stepIndex
                return (
                  <div key={step.key} className="relative pb-4 last:pb-0">
                    {i < timelineSteps.length - 1 && (
                      <div className={`absolute left-[7px] top-3 w-0.5 h-full -translate-x-1/2 ${isDone ? "bg-[var(--text-link)]" : "bg-[var(--border)]"}`} />
                    )}
                    <div className="flex items-start gap-3">
                      <div className={`relative z-10 w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${isDone ? "bg-[var(--text-link)]" : "bg-[var(--border)]"} ${isCurrent ? "ring-2 ring-blue-200" : ""}`}>
                        {isDone && <CheckCircle className="w-3 h-3 text-white" />}
                      </div>
                      <div>
                        <p className={`text-xs font-semibold ${isDone ? "text-[var(--text-link)]" : "text-[var(--text-muted)]"}`}>{step.label}</p>
                        {isCurrent && mission.status === "in_transit" && (
                          <p className="text-[10px] text-[var(--text-secondary)]">Arrivée estimée {new Date(Date.now() + 2 * 60 * 60 * 1000).toLocaleString("fr-FR")}</p>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {deliveryPerson && (
            <div className="bg-[var(--bg-primary)] rounded-2xl border-2 border-[var(--border)] p-4">
              <h3 className="font-bold text-[var(--text-primary)] text-sm mb-3 flex items-center gap-2">
                <User className="w-4 h-4 text-[var(--text-link)]" />
                Votre livreur
              </h3>
              <div className="flex items-center gap-3 mb-3">
                <img src={deliveryPerson.avatar} alt={deliveryPerson.name} className="w-12 h-12 rounded-full bg-[var(--bg-secondary)] ring-2 ring-green-200" />
                <div>
                  <p className="font-bold text-sm text-[var(--text-primary)]">{deliveryPerson.name}</p>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-50 text-green-700 text-[10px] font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                    En cours de livraison
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-[var(--text-link)] font-medium mb-2">
                <ShieldCheck className="w-3 h-3" /> Employé AXEL - KYC validé
              </div>
              <a href={`tel:${deliveryPerson.phone}`} className="flex items-center gap-2 text-xs text-[var(--text-link)] hover:underline">
                <Phone className="w-3 h-3" /> {deliveryPerson.phone}
              </a>
            </div>
          )}

          <div className="bg-[var(--bg-primary)] rounded-2xl border-2 border-[var(--border)] p-4">
            <h3 className="font-bold text-[var(--text-primary)] text-sm mb-3">Détails de la livraison</h3>
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <Package className="w-4 h-4 text-[var(--text-link)] mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-[var(--text-primary)]">Commande {mission.orderId}</p>
                  <p className="text-[10px] text-[var(--text-secondary)]" />
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Store className="w-4 h-4 text-[var(--text-link)] mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-[var(--text-primary)]">{mission.pickupAddress}</p>
                  <p className="text-[10px] text-[var(--text-secondary)]">Boutique de retrait</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-[var(--text-link)] mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-[var(--text-primary)]">{mission.deliveryAddress}</p>
                  <p className="text-[10px] text-[var(--text-secondary)]">Adresse de livraison</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Clock className="w-4 h-4 text-[var(--text-link)] mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-[var(--text-primary)]">{new Date(Date.now() + 2 * 60 * 60 * 1000).toLocaleString("fr-FR")}</p>
                  <p className="text-[10px] text-[var(--text-secondary)]">Livraison estimée</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

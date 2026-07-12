"use client"

import { Phone, Star, Package, Clock, Shield, ShieldCheck, ShieldX } from "lucide-react"
import type { DeliveryPerson } from "@/data/delivery"

interface DeliveryPersonCardProps {
  person: DeliveryPerson
  onAssign?: (personId: string) => void
  compact?: boolean
  showDistance?: string
}

const kycConfig: Record<string, { label: string; color: string; bg: string; icon: typeof ShieldCheck }> = {
  verified: { label: "KYC validé", color: "text-green-600", bg: "bg-green-50", icon: ShieldCheck },
  approved: { label: "KYC validé", color: "text-green-600", bg: "bg-green-50", icon: ShieldCheck },
  pending: { label: "KYC en cours", color: "text-amber-600", bg: "bg-amber-50", icon: Shield },
  rejected: { label: "KYC rejeté", color: "text-red-600", bg: "bg-red-50", icon: ShieldX },
}

export default function DeliveryPersonCard({ person, onAssign, compact = false, showDistance }: DeliveryPersonCardProps) {
  const kyc = kycConfig[person.kycStatus]
  const KycIcon = kyc.icon

  return (
    <div
      className={`group relative bg-[var(--bg-primary)] rounded-2xl border-2 transition-all duration-300 ${
        person.available
          ? "border-green-200 hover:border-green-400 hover:shadow-lg hover:shadow-green-100"
          : "border-red-200 hover:border-red-400 opacity-75"
      }`}
    >
      <div className="absolute top-3 right-3 flex flex-col items-end gap-1.5">
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
            person.available ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
          }`}
        >
          <span className={`w-2 h-2 rounded-full ${person.available ? "bg-green-500 animate-pulse" : "bg-red-400"}`} />
          {person.available ? "Disponible" : "Indisponible"}
        </span>
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${kyc.bg} ${kyc.color}`}>
          <KycIcon className="w-3 h-3" />
          {kyc.label}
        </span>
      </div>

      <div className="p-4">
        <div className="flex items-center gap-3 mb-3">
          <img src={person.avatar} alt={person.name} className="w-12 h-12 rounded-full bg-[var(--bg-secondary)] ring-2 ring-[#E5E7EB]" />
          <div>
            <h3 className="font-bold text-sm text-[var(--text-primary)]">{person.name}</h3>
            <div className="flex items-center gap-1 text-xs text-[var(--text-secondary)]">
              <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
              {person.rating} | {person.missionsCount} livraisons
            </div>
            {showDistance && (
              <span className="text-[10px] text-[var(--text-link)] font-semibold">{showDistance}</span>
            )}
          </div>
        </div>

        {!compact && (
          <div className="space-y-1.5 mb-3">
            <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
              <Phone className="w-3 h-3" /> {person.phone}
            </div>
            <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
              <Clock className="w-3 h-3" /> Actif
            </div>
            <div className="flex items-center gap-2 text-xs text-[var(--text-link)] font-medium">
              <Package className="w-3 h-3" /> Employé AXEL
            </div>
          </div>
        )}

        {onAssign && (
          <button
            onClick={() => onAssign(person.id)}
            disabled={!person.available || (person.kycStatus !== "approved" && person.kycStatus !== "verified")}
            className={`w-full py-2 rounded-xl text-sm font-semibold transition-all ${
              person.available && (person.kycStatus === "approved" || person.kycStatus === "verified")
                ? "bg-blue-50 text-[var(--text-link)] hover:bg-blue-100 active:scale-[0.98]"
                : person.kycStatus !== "approved" && person.kycStatus !== "verified"
                  ? "bg-amber-50 text-amber-400 cursor-not-allowed"
                  : "bg-gray-50 text-gray-300 cursor-not-allowed"
            }`}
          >
            {person.kycStatus !== "approved" && person.kycStatus !== "verified"
              ? "KYC non validé"
              : person.available
                ? "Attribuer la mission"
                : "Indisponible"}
          </button>
        )}
      </div>
    </div>
  )
}

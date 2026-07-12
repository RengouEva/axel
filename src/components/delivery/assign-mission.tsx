"use client"

import { useState } from "react"
import { Search, MapPin, User, ChevronDown, Check, ArrowRight, ShieldCheck } from "lucide-react"
import type { DeliveryMission, DeliveryPerson, Country, City, District } from "@/data/delivery"
import DeliveryMap from "./delivery-map"
import DeliveryPersonCard from "./delivery-person-card"

interface AssignMissionProps {
  mission: DeliveryMission
  persons: DeliveryPerson[]
  countries: Country[]
  cities: City[]
  districts: District[]
  onAssign: (missionId: string, personId: string) => void
}

function distance(a: { x: number; y: number }, b: { x: number; y: number }) {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2)
}

export default function AssignMission({ mission, persons, countries, cities, districts, onAssign }: AssignMissionProps) {
  const [selectedCityId, setSelectedCityId] = useState(mission.cityId)
  const [selectedDistrictId, setSelectedDistrictId] = useState<string | null>(mission.districtId)
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null)
  const [search, setSearch] = useState("")

  const sameCity = persons.filter(
    (p) => p.cityId === selectedCityId && p.available && (p.kycStatus === "approved" || p.kycStatus === "verified"),
  )

  const sorted = sameCity
    .map((p) => ({
      ...p,
      _dist: distance(p.location, { x: 350, y: 200 }),
      _inDistrict: p.districtId === selectedDistrictId,
    }))
    .sort((a, b) => {
      if (a._inDistrict && !b._inDistrict) return -1
      if (!a._inDistrict && b._inDistrict) return 1
      return a._dist - b._dist
    })

  const filtered = sorted.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()))

  const selectedPerson = persons.find((p) => p.id === selectedPersonId)

  return (
    <div className="grid lg:grid-cols-5 gap-6">
      <div className="lg:col-span-3">
        <DeliveryMap
          cities={cities}
          districts={districts}
          persons={persons}
          missions={[mission]}
          selectedCityId={selectedCityId}
          selectedDistrictId={selectedDistrictId || undefined}
          interactive
          onCityClick={(id) => { setSelectedCityId(id); setSelectedDistrictId(null) }}
          onDistrictClick={(id) => setSelectedDistrictId(selectedDistrictId === id ? null : id)}
        />
      </div>

      <div className="lg:col-span-2 space-y-4">
        <div className="bg-[var(--bg-primary)] rounded-2xl border-2 border-[var(--border)] p-4">
          <h3 className="font-bold text-[var(--text-primary)] mb-1">Mission {mission.id}</h3>
          <p className="text-xs text-[var(--text-secondary)] mb-3">Commande {mission.orderId} | {mission.customerName}</p>
          <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
            <MapPin className="w-3 h-3 text-[var(--text-link)]" /> {mission.deliveryAddress}
          </div>
          <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)] mt-1">
            <User className="w-3 h-3 text-[var(--text-link)]" /> {mission.customerPhone}
          </div>
        </div>

        <div className="bg-[var(--bg-primary)] rounded-2xl border-2 border-[var(--border)] p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-sm text-[var(--text-primary)] flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-green-500" />
              Livreurs AXEL disponibles
            </h3>
            <span className="text-xs text-[var(--text-link)] font-semibold">{sorted.length} trouvés</span>
          </div>

          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
            <input
              type="text"
              placeholder="Rechercher un livreur..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl border-2 border-[var(--border)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--border-hover)] transition-colors"
            />
          </div>

          <div className="space-y-2 max-h-[320px] overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="text-xs text-[var(--text-muted)] text-center py-4">Aucun livreur disponible dans cette ville</p>
            ) : (
              filtered.map((p) => {
                const distText = p._dist < 5
                  ? "À proximité immédiate"
                  : p._dist < 15
                    ? `À ${Math.round(p._dist)} km`
                    : `À ${Math.round(p._dist)} km`

                return (
                  <label
                    key={p.id}
                    className={`flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition-all ${
                      selectedPersonId === p.id
                        ? "bg-blue-50 border-2 border-[var(--border-hover)]"
                        : "bg-[var(--bg-secondary)] border-2 border-transparent hover:border-[var(--border)]"
                    } ${p._inDistrict ? "ring-1 ring-green-200" : ""}`}
                  >
                    <input
                      type="radio"
                      name="person"
                      value={p.id}
                      checked={selectedPersonId === p.id}
                      onChange={() => setSelectedPersonId(p.id)}
                      className="sr-only"
                    />
                    <img src={p.avatar} alt={p.name} className="w-8 h-8 rounded-full bg-[var(--bg-primary)]" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs font-semibold text-[var(--text-primary)] truncate">{p.name}</p>
                        {p._inDistrict && (
                          <span className="text-[10px] text-green-600 font-semibold shrink-0">MÃªme quartier</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-[var(--text-secondary)]">
                        <span>â˜… {p.rating}</span>
                        <span>{p.missionsCount} livr.</span>
                        <span className="text-[var(--text-link)]">{distText}</span>
                      </div>
                    </div>
                    {selectedPersonId === p.id && (
                      <div className="w-5 h-5 rounded-full bg-[var(--text-link)] flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </label>
                )
              })
            )}
          </div>

          <button
            onClick={() => selectedPersonId && onAssign(mission.id, selectedPersonId)}
            disabled={!selectedPersonId}
            className={`w-full mt-3 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
              selectedPersonId
                ? "bg-[var(--text-link)] text-white hover:bg-[#0B4FC8] active:scale-[0.98]"
                : "bg-gray-100 text-gray-300 cursor-not-allowed"
            }`}
          >
            {selectedPersonId
              ? `Attribuer à ${selectedPerson?.name?.split(" ")[0] || "..."}`
              : "Sélectionnez un livreur"}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

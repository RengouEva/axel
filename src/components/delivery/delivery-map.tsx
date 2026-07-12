"use client"

import { type ReactNode } from "react"
import { MapPin, Package } from "lucide-react"
import type { City, District, DeliveryPerson, DeliveryMission } from "@/data/delivery"

interface DeliveryMapProps {
  cities: City[]
  districts?: District[]
  persons?: DeliveryPerson[]
  missions?: DeliveryMission[]
  selectedCityId?: string
  selectedDistrictId?: string
  interactive?: boolean
  onCityClick?: (cityId: string) => void
  onDistrictClick?: (districtId: string) => void
  onPersonClick?: (personId: string) => void
  children?: ReactNode
}

export default function DeliveryMap({
  cities,
  districts = [],
  persons = [],
  missions = [],
  selectedCityId,
  selectedDistrictId,
  interactive = false,
  onCityClick,
  onDistrictClick,
  onPersonClick,
  children,
}: DeliveryMapProps) {
  const activeMissions = missions.filter((m) => m.status !== "delivered" && m.status !== "cancelled")

  const visibleDistricts = selectedCityId ? districts.filter((d) => d.cityId === selectedCityId) : []

  return (
    <div className="relative w-full">
      <svg
        viewBox="0 0 500 420"
        className="w-full h-auto rounded-2xl border-2 border-[var(--border)] bg-gradient-to-br from-[#F0F4FF] to-[#E8F0FE]"
      >
        <defs>
          <filter id="glow2"><feDropShadow dx="0" dy="0" stdDeviation="3" floodOpacity="0.3" /></filter>
          <filter id="shadow"><feDropShadow dx="0" dy="1" stdDeviation="1.5" floodOpacity="0.2" /></filter>
        </defs>

        {!selectedCityId ? (
          cities.map((c) => {
            const isSel = c.id === selectedCityId
            return (
              <g
                key={c.id}
                className={interactive ? "cursor-pointer" : ""}
                onClick={() => interactive && onCityClick?.(c.id)}
              >
                <circle cx={c.x} cy={c.y} r={isSel ? 30 : 22} fill="#1769F2" opacity={isSel ? 0.2 : 0.08} />
                <circle cx={c.x} cy={c.y} r={isSel ? 30 : 22} fill="none" stroke="#1769F2" strokeWidth={isSel ? 2.5 : 1} opacity={isSel ? 1 : 0.35} />
                <text x={c.x} y={c.y + 4} textAnchor="middle" fill="#1769F2" fontSize={isSel ? 12 : 10} fontWeight={isSel ? "bold" : "600"} className="select-none">{c.name}</text>
              </g>
            )
          })
        ) : (
          <>
            {visibleDistricts.map((d) => {
              const isSel = d.id === selectedDistrictId
              return (
                <g
                  key={d.id}
                  className={interactive ? "cursor-pointer" : ""}
                  onClick={() => interactive && onDistrictClick?.(d.id)}
                >
                  <rect
                    x={d.x - 25}
                    y={d.y - 15}
                    width={50}
                    height={30}
                    rx={8}
                    fill="#10B981"
                    opacity={isSel ? 0.2 : 0.06}
                    stroke="#10B981"
                    strokeWidth={isSel ? 2 : 0.5}
                    strokeDasharray={isSel ? "none" : "4 3"}
                  />
                  <text x={d.x} y={d.y + 4} textAnchor="middle" fill="#10B981" fontSize={10} fontWeight={isSel ? "bold" : "500"} className="select-none">{d.name}</text>
                </g>
              )
            })}
          </>
        )}

        {activeMissions.map((m) => {
          const person = persons.find((p) => p.id === m.deliveryPersonId)
          const destCity = cities.find(c => c.id === m.cityId)
          const destDist = districts.find(d => d.id === m.districtId)
          const destX = destDist ? destDist.x : destCity ? destCity.x : 200
          const destY = destDist ? destDist.y : destCity ? destCity.y : 200
          const pickupX = destX - 30
          const pickupY = destY - 20
          return (
            <g key={m.id}>
              <line x1={pickupX} y1={pickupY} x2={destX} y2={destY} stroke="#1769F2" strokeWidth={2} strokeDasharray="6 4" opacity={0.35} />
              <circle cx={pickupX} cy={pickupY} r={5} fill="#1769F2" opacity={0.5} />
              <image href="https://img.icons8.com/fluency/48/marker.png" x={destX - 10} y={destY - 22} width={20} height={20} />
              {m.status === "in_transit" && (
                <circle cx={(pickupX + destX) / 2} cy={(pickupY + destY) / 2} r={6} fill="#10B981" filter="url(#glow2)">
                  <animate attributeName="opacity" values="0.5;1;0.5" dur="2s" repeatCount="indefinite" />
                </circle>
              )}
              {person && (
                <g>
                  <circle cx={person.location.x} cy={person.location.y} r={12} fill="white" stroke="#1769F2" strokeWidth={2} filter="url(#shadow)" />
                  <text x={person.location.x} y={person.location.y + 4} textAnchor="middle" fontSize={11}>ðŸ</text>
                </g>
              )}
            </g>
          )
        })}

        {persons.map((p) => {
          const hasMission = activeMissions.some((m) => m.deliveryPersonId === p.id)
          if (hasMission) return null
          return (
            <g
              key={p.id}
              className={interactive ? "cursor-pointer" : ""}
              onClick={() => interactive && onPersonClick?.(p.id)}
            >
              <circle cx={p.location.x} cy={p.location.y} r={10} fill={p.available ? "#10B981" : "#EF4444"} opacity={0.15} />
              <circle cx={p.location.x} cy={p.location.y} r={8} fill="white" stroke={p.available ? "#10B981" : "#EF4444"} strokeWidth={2.5} filter="url(#shadow)" />
              <circle cx={p.location.x - 2} cy={p.location.y - 1} r={2.5} fill={p.available ? "#10B981" : "#EF4444"} />
              <path d={`M${p.location.x - 3} ${p.location.y + 4} Q${p.location.x} ${p.location.y + 1} ${p.location.x + 3} ${p.location.y + 4}`} stroke={p.available ? "#10B981" : "#EF4444"} fill="none" strokeWidth={1.5} />
              <text x={p.location.x} y={p.location.y + 17} textAnchor="middle" fontSize={7} fill="#64748B" fontWeight="500">{p.name.split(" ")[0]}</text>
            </g>
          )
        })}

        <text x={10} y={18} fontSize={9} fill="#94A3B8">Livreur | Colis | Villes/Quartiers</text>
      </svg>

      <div className="flex flex-wrap gap-4 mt-3 text-xs text-[var(--text-secondary)]">
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-green-500" /> Disponible</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-red-500" /> Indisponible</span>
        <span className="flex items-center gap-1"><MapPin className="w-3 h-3 text-blue-500" /> En transit</span>
        <span className="flex items-center gap-1"><Package className="w-3 h-3 text-blue-500" /> Colis</span>
      </div>

      {children}
    </div>
  )
}

"use client"

import { useState } from "react"
import { Search, Package, MapPin, Building2, Globe, ArrowRight } from "lucide-react"
import { AnimatedDiv } from "@/lib/animations"
import { useDelivery } from "@/lib/delivery-context"
import DeliveryTracking from "@/components/delivery/delivery-tracking"

export default function LivraisonPage() {
  const { missions, persons, countries, cities, districts } = useDelivery()
  const [searchId, setSearchId] = useState("")
  const [selectedMissionId, setSelectedMissionId] = useState<string | null>(null)

  const activeMissions = missions.filter((m) => m.status !== "delivered" && m.status !== "cancelled")
  const deliveredMissions = missions.filter((m) => m.status === "delivered")

  const filteredActive = activeMissions.filter(
    (m) => !searchId || m.id.toLowerCase().includes(searchId.toLowerCase()) || m.orderId.toLowerCase().includes(searchId.toLowerCase()),
  )

  const selectedMission = missions.find((m) => m.id === selectedMissionId)

  const getCityName = (id: string) => cities.find((c) => c.id === id)?.name || id
  const getCountryName = (id: string) => countries.find((c) => c.id === id)?.flag || ""

  return (
    <div className="w-full min-h-screen bg-[var(--bg-secondary)]">
      <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-4xl font-bold text-[var(--text-primary)]">Suivi de livraison</h1>
            <p className="text-[var(--text-secondary)]">Suivez vos colis livrés par AXEL en temps réel</p>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
            <input
              type="text"
              placeholder="N° commande ou mission..."
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              className="w-64 pl-9 pr-3 py-2 rounded-xl border-2 border-[var(--border)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--border-hover)] transition-colors"
            />
          </div>
        </div>

        {selectedMission ? (
          <div>
            <button
              onClick={() => setSelectedMissionId(null)}
              className="flex items-center gap-1 text-sm text-[var(--text-link)] font-semibold mb-4 hover:underline"
            >
              {"<- Retour à la liste"}
            </button>
            <DeliveryTracking mission={selectedMission} persons={persons} cities={cities} districts={districts} />
          </div>
        ) : (
          <>
            <AnimatedDiv fade slideUp className="mb-8">
              <h2 className="text-lg font-bold text-[var(--text-primary)] mb-4">Livraisons en cours ({filteredActive.length})</h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredActive.length === 0 ? (
                  <p className="text-sm text-[var(--text-secondary)] col-span-full text-center py-8">Aucune livraison active trouvée.</p>
                ) : (
                  filteredActive.map((m, i) => (
                    <AnimatedDiv
                      key={m.id}
                      fade
                      slideUp
                      delay={i * 0.05}
                      onClick={() => setSelectedMissionId(m.id)}
                      className="bg-[var(--bg-primary)] rounded-2xl border-2 border-[var(--border)] p-4 cursor-pointer hover:border-[var(--border-hover)]/30 hover:shadow-lg transition-all group"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-10 h-10 rounded-xl bg-[var(--bg-secondary)] flex items-center justify-center">
                            <Package className="w-5 h-5 text-[var(--text-link)]" />
                          </div>
                          <div>
                            <p className="font-semibold text-sm text-[var(--text-primary)]">Commande {m.orderId}</p>
                            <p className="text-[10px] text-[var(--text-secondary)]">{m.id}</p>
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-[var(--text-muted)] group-hover:text-[var(--text-link)] group-hover:translate-x-1 transition-all" />
                      </div>
                      <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          m.status === "in_transit" ? "bg-green-50 text-green-700" :
                          m.status === "picked_up" ? "bg-purple-50 text-purple-700" :
                          m.status === "assigned" ? "bg-blue-50 text-blue-700" :
                          "bg-amber-50 text-amber-700"
                        }`}>
                          {m.status === "in_transit" ? "En transit" :
                           m.status === "picked_up" ? "Récupéré" :
                           m.status === "assigned" ? "Attribué" : "En attente"}
                        </span>
                        <span>{getCountryName(m.countryId)} {getCityName(m.cityId)}</span>
                      </div>
                    </AnimatedDiv>
                  ))
                )}
              </div>
            </AnimatedDiv>

            {deliveredMissions.length > 0 && (
              <AnimatedDiv fade slideUp>
                <h2 className="text-lg font-bold text-[var(--text-primary)] mb-4">Livraisons terminées ({deliveredMissions.length})</h2>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {deliveredMissions.map((m, i) => (
                    <AnimatedDiv
                      key={m.id}
                      fade
                      slideUp
                      delay={i * 0.05}
                      onClick={() => setSelectedMissionId(m.id)}
                      className="bg-[var(--bg-primary)] rounded-2xl border-2 border-[var(--border)] p-4 cursor-pointer hover:border-green-300 hover:shadow-lg transition-all opacity-75 group"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
                            <Package className="w-5 h-5 text-green-600" />
                          </div>
                          <div>
                            <p className="font-semibold text-sm text-[var(--text-primary)]">Commande {m.orderId}</p>
                            <p className="text-[10px] text-[var(--text-secondary)]">{m.id}</p>
                          </div>
                        </div>
                      </div>
                      <span className="inline-block px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-[10px] font-semibold">Livré</span>
                    </AnimatedDiv>
                  ))}
                </div>
              </AnimatedDiv>
            )}
          </>
        )}
      </div>
    </div>
  )
}

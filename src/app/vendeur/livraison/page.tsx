"use client"

import { useState } from "react"
import { Truck, Users, Globe, Building2, MapPin, RefreshCw, ArrowRight, CheckCircle, XCircle, Clock, ShieldCheck } from "lucide-react"
import { AnimatedDiv } from "@/lib/animations"
import { useDelivery } from "@/lib/delivery-context"
import DeliveryMap from "@/components/delivery/delivery-map"
import DeliveryPersonCard from "@/components/delivery/delivery-person-card"
import AssignMission from "@/components/delivery/assign-mission"

export default function SellerLivraisonPage() {
  const {
    missions,
    persons,
    countries,
    cities,
    districts,
    filters,
    setFilter,
    filteredPersons,
    assignPerson,
    updateMissionStatus,
    togglePersonAvailability,
    getClosestAvailable,
  } = useDelivery()

  const [tab, setTab] = useState<"missions" | "livreurs">("missions")
  const [selectedCityId, setSelectedCityId] = useState<string | null>(null)
  const [selectedDistrictId, setSelectedDistrictId] = useState<string | null>(null)
  const [assigningMissionId, setAssigningMissionId] = useState<string | null>(null)

  const pendingMissions = missions.filter((m) => m.status === "pending")
  const activeMissions = missions.filter((m) => m.status !== "pending" && m.status !== "delivered" && m.status !== "cancelled")
  const deliveredMissions = missions.filter((m) => m.status === "delivered")

  const sortedPersons = selectedCityId
    ? getClosestAvailable({ x: 200, y: 200 }, selectedCityId, selectedDistrictId || undefined)
    : []

  const visiblePersons = selectedCityId ? sortedPersons : filteredPersons
  const availableCount = persons.filter((p) => p.available).length
  const kycApprovedCount = persons.filter((p) => (p.kycStatus === "approved" || p.kycStatus === "verified")).length

  const filerCities = filters.countryId ? cities.filter((c) => c.countryId === filters.countryId) : []
  const filterDistricts = filters.cityId ? districts.filter((d) => d.cityId === filters.cityId) : []

  return (
    <div className="w-full min-h-screen bg-[var(--bg-secondary)]">
      <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-4xl font-bold text-[var(--text-primary)]">Gestion des livraisons</h1>
            <p className="text-[var(--text-secondary)]">
              AXEL met à disposition ses livreurs certifiés KYC pour vos expéditions
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-50 text-green-700 font-semibold">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              {availableCount} disponibles
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" />
              {kycApprovedCount} KYC validés
            </span>
            <span className="px-3 py-1.5 rounded-full bg-amber-50 text-amber-700 font-semibold">
              {pendingMissions.length} en attente
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => setTab("missions")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              tab === "missions" ? "bg-[var(--text-link)] text-white shadow-lg shadow-blue-200" : "bg-[var(--bg-primary)] text-[var(--text-secondary)] border-2 border-[var(--border)] hover:border-[var(--border-hover)]/30"
            }`}
          >
            <Truck className="w-4 h-4" />
            Missions
          </button>
          <button
            onClick={() => setTab("livreurs")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              tab === "livreurs" ? "bg-[var(--text-link)] text-white shadow-lg shadow-blue-200" : "bg-[var(--bg-primary)] text-[var(--text-secondary)] border-2 border-[var(--border)] hover:border-[var(--border-hover)]/30"
            }`}
          >
            <Users className="w-4 h-4" />
            Livreurs AXEL
          </button>
        </div>

        {tab === "missions" && (
          <>
            <div className="grid lg:grid-cols-5 gap-6 mb-6">
              <div className="lg:col-span-3">
                <DeliveryMap
                  cities={cities}
                  districts={districts}
                  persons={persons}
                  missions={missions}
                  selectedCityId={selectedCityId || undefined}
                  selectedDistrictId={selectedDistrictId || undefined}
                  interactive
                  onCityClick={(id) => setSelectedCityId(selectedCityId === id ? null : id)}
                  onDistrictClick={(id) => setSelectedDistrictId(selectedDistrictId === id ? null : id)}
                />
              </div>
              <div className="lg:col-span-2 space-y-3">
                {pendingMissions.length > 0 && (
                  <div className="bg-[var(--bg-primary)] rounded-2xl border-2 border-amber-200 p-4">
                    <h3 className="font-bold text-sm text-[var(--text-primary)] mb-3 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-amber-500" />
                      Missions en attente d'attribution
                    </h3>
                    <div className="space-y-2">
                      {pendingMissions.map((m) => (
                        <div key={m.id} className="flex items-center justify-between p-2.5 rounded-xl bg-amber-50">
                          <div>
                            <p className="text-xs font-semibold text-[var(--text-primary)]">{m.orderId}</p>
                            <p className="text-[10px] text-[var(--text-secondary)]">{m.customerName} | {m.deliveryAddress}</p>
                          </div>
                          <button
                            onClick={() => setAssigningMissionId(m.id)}
                            className="flex items-center gap-1 text-xs font-semibold text-[var(--text-link)] hover:underline shrink-0"
                          >
                            Attribuer <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="bg-[var(--bg-primary)] rounded-2xl border-2 border-[var(--border)] p-4">
                  <h3 className="font-bold text-sm text-[var(--text-primary)] mb-3 flex items-center gap-2">
                    <Truck className="w-4 h-4 text-[var(--text-link)]" />
                    Livraisons en cours ({activeMissions.length})
                  </h3>
                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {activeMissions.length === 0 ? (
                      <p className="text-xs text-[var(--text-muted)] text-center py-3">Aucune livraison en cours</p>
                    ) : (
                      activeMissions.map((m) => (
                        <div key={m.id} className="flex items-center justify-between p-2.5 rounded-xl bg-[var(--bg-secondary)]">
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${
                              m.status === "in_transit" ? "bg-green-500 animate-pulse" :
                              m.status === "picked_up" ? "bg-purple-500" : "bg-blue-500"
                            }`} />
                            <div>
                              <p className="text-xs font-semibold text-[var(--text-primary)]">{m.orderId}</p>
                              <p className="text-[10px] text-[var(--text-secondary)]">
                                Livreur: {persons.find((p) => p.id === m.deliveryPersonId)?.name || "-"}
                                {m.deliveryPersonId && persons.find((p) => p.id === m.deliveryPersonId)?.kycStatus === "approved" && (
                                  <span className="ml-1 text-green-600">KYC âœ“</span>
                                )}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => updateMissionStatus(m.id, "delivered")}
                            className="text-[10px] font-semibold text-green-600 hover:bg-green-50 px-2 py-1 rounded-lg transition-colors"
                          >
                            Marquer livré
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {deliveredMissions.length > 0 && (
                  <div className="bg-[var(--bg-primary)] rounded-2xl border-2 border-green-200 p-4">
                    <h3 className="font-bold text-sm text-[var(--text-primary)] mb-3 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      Dernières livraisons
                    </h3>
                    <div className="space-y-1">
                      {deliveredMissions.map((m) => (
                        <div key={m.id} className="flex items-center justify-between text-xs text-[var(--text-secondary)] py-1">
                          <span className="font-medium text-[var(--text-primary)]">{m.orderId}</span>
                          <span>{m.completedAt ? new Date(m.completedAt).toLocaleDateString("fr-FR") : "-"}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {assigningMissionId && (() => {
              const mission = missions.find((m) => m.id === assigningMissionId)
              if (!mission) return null
              return (
                <AnimatedDiv fade slideUp className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                  <div className="bg-[var(--bg-primary)] rounded-3xl p-6 w-full max-w-5xl max-h-[90vh] overflow-y-auto">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-lg font-bold text-[var(--text-primary)]">Attribuer la mission à un livreur AXEL</h2>
                      <button onClick={() => setAssigningMissionId(null)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] text-xl">&times;</button>
                    </div>
                    <p className="text-sm text-[var(--text-secondary)] mb-4">
                      Sélectionnez le livreur le plus proche de votre boutique. Les livreurs du mÃªme quartier apparaissent en premier.
                    </p>
                    <AssignMission
                      mission={mission}
                      persons={persons}
                      countries={countries}
                      cities={cities}
                      districts={districts}
                      onAssign={(missionId, personId) => {
                        assignPerson(missionId, personId)
                        setAssigningMissionId(null)
                      }}
                    />
                  </div>
                </AnimatedDiv>
              )
            })()}
          </>
        )}

        {tab === "livreurs" && (
          <div className="grid lg:grid-cols-5 gap-6">
            <div className="lg:col-span-3">
              <DeliveryMap
                cities={cities}
                districts={districts}
                persons={persons}
                missions={missions}
                selectedCityId={selectedCityId || undefined}
                selectedDistrictId={selectedDistrictId || undefined}
                interactive
                onCityClick={(id) => setSelectedCityId(selectedCityId === id ? null : id)}
                onDistrictClick={(id) => setSelectedDistrictId(selectedDistrictId === id ? null : id)}
              />
            </div>
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-[var(--text-primary)]">Équipe AXEL</h3>
                <span className="text-xs text-[var(--text-secondary)]">{persons.length} livreurs | {availableCount} dispo</span>
              </div>

              <div className="flex flex-wrap gap-1.5">
                <select
                  value={filters.countryId || ""}
                  onChange={(e) => setFilter("countryId", e.target.value || null)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-secondary)] focus:outline-none focus:border-[var(--border-hover)]"
                >
                  <option value="">Tous les pays</option>
                  {countries.map((c) => (
                    <option key={c.id} value={c.id}>{c.flag} {c.name}</option>
                  ))}
                </select>

                <select
                  value={filters.cityId || ""}
                  onChange={(e) => setFilter("cityId", e.target.value || null)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-secondary)] focus:outline-none focus:border-[var(--border-hover)]"
                  disabled={!filters.countryId}
                >
                  <option value="">Toutes les villes</option>
                  {filerCities.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>

                <select
                  value={filters.districtId || ""}
                  onChange={(e) => setFilter("districtId", e.target.value || null)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-secondary)] focus:outline-none focus:border-[var(--border-hover)]"
                  disabled={!filters.cityId}
                >
                  <option value="">Tous les quartiers</option>
                  {filterDistricts.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-3 max-h-[500px] overflow-y-auto">
                {filteredPersons.length === 0 ? (
                  <p className="text-xs text-[var(--text-muted)] text-center py-4">Aucun livreur trouvé</p>
                ) : (
                  filteredPersons.map((p) => (
                    <DeliveryPersonCard
                      key={p.id}
                      person={p}
                      onAssign={p.available ? () => togglePersonAvailability(p.id) : () => togglePersonAvailability(p.id)}
                    />
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

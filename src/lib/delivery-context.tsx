"use client"

import { createContext, useContext, useState, useCallback, useMemo, useEffect, type ReactNode } from "react"
import type { DeliveryMission, DeliveryPerson, Country, City, District, MissionStatus, KycStatus } from "@/data/delivery"
import { useAuth } from "@/lib/auth-context"

function distance(a: { x: number; y: number }, b: { x: number; y: number }) {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2)
}

interface DeliveryFilters {
  countryId: string | null
  cityId: string | null
  districtId: string | null
}

interface DeliveryState {
  missions: DeliveryMission[]
  persons: DeliveryPerson[]
  countries: Country[]
  cities: City[]
  districts: District[]
  filters: DeliveryFilters
  setFilter: (key: keyof DeliveryFilters, value: string | null) => void
  filteredPersons: DeliveryPerson[]
  assignPerson: (missionId: string, personId: string) => void
  updateMissionStatus: (missionId: string, status: MissionStatus) => void
  updatePersonLocation: (personId: string, x: number, y: number) => void
  togglePersonAvailability: (personId: string) => void
  getClosestAvailable: (location: { x: number; y: number }, cityId: string, districtId?: string) => DeliveryPerson[]
  getCityPersons: (cityId: string) => DeliveryPerson[]
  getDistrictPersons: (districtId: string) => DeliveryPerson[]
}

const DeliveryContext = createContext<DeliveryState | null>(null)

export function DeliveryProvider({ children }: { children: ReactNode }) {
  const [missions, setMissions] = useState<DeliveryMission[]>([])
  const [persons, setPersons] = useState<DeliveryPerson[]>([])
  const [countries, setCountries] = useState<Country[]>([])
  const [cities, setCities] = useState<City[]>([])
  const [districts, setDistricts] = useState<District[]>([])
  const [filters, setFilters] = useState<DeliveryFilters>({ countryId: null, cityId: null, districtId: null })
  const { getAuthHeaders } = useAuth()

  useEffect(() => {
    const headers = getAuthHeaders()
    Promise.all([
      fetch("/api/delivery", { headers }).then(r => r.json()),
      fetch("/api/locations").then(r => r.json()),
    ]).then(([deliveryData, locData]) => {
      if (deliveryData.missions) setMissions(deliveryData.missions)
      if (deliveryData.persons) setPersons(deliveryData.persons)
      setCountries(locData.countries || deliveryData.countries || [])
      setCities(locData.cities || deliveryData.cities || [])
      setDistricts(locData.districts || deliveryData.districts || [])
    }).catch(() => {})
  }, [getAuthHeaders])

  const setFilter = useCallback((key: keyof DeliveryFilters, value: string | null) => {
    setFilters((prev) => {
      if (key === "countryId") return { countryId: value, cityId: null, districtId: null }
      if (key === "cityId") return { ...prev, cityId: value, districtId: null }
      return { ...prev, [key]: value }
    })
  }, [])

  const filteredPersons = useMemo(() => {
    let result = persons
    if (filters.countryId) result = result.filter((p) => p.countryId === filters.countryId)
    if (filters.cityId) result = result.filter((p) => p.cityId === filters.cityId)
    if (filters.districtId) result = result.filter((p) => p.districtId === filters.districtId)
    return result
  }, [persons, filters])

  const assignPerson = useCallback((missionId: string, personId: string) => {
    setMissions((prev) =>
      prev.map((m) =>
        m.id === missionId
          ? { ...m, deliveryPersonId: personId, status: "assigned" as MissionStatus, assignedAt: new Date().toISOString() }
          : m,
      ),
    )
  }, [])

  const updateMissionStatus = useCallback((missionId: string, status: MissionStatus) => {
    setMissions((prev) =>
      prev.map((m) =>
        m.id === missionId
          ? { ...m, status, ...(status === "delivered" ? { deliveredAt: new Date().toISOString() } : {}) }
          : m,
      ),
    )
  }, [])

  const updatePersonLocation = useCallback((personId: string, x: number, y: number) => {
    setPersons((prev) => prev.map((p) => (p.id === personId ? { ...p, location: { x, y } } : p)))
  }, [])

  const togglePersonAvailability = useCallback((personId: string) => {
    setPersons((prev) => prev.map((p) => (p.id === personId ? { ...p, available: !p.available } : p)))
  }, [])

  const getClosestAvailable = useCallback(
    (location: { x: number; y: number }, cityId: string, districtId?: string): DeliveryPerson[] => {
      let candidates = persons.filter((p) => p.available && (p.kycStatus === "approved" || p.kycStatus === "verified") && p.cityId === cityId)
      if (districtId) {
        const sameDistrict = candidates.filter((p) => p.districtId === districtId)
        if (sameDistrict.length > 0) candidates = sameDistrict
      }
      return candidates
        .map((p) => ({ ...p, _dist: distance(p.location, location) }))
        .sort((a, b) => a._dist - b._dist)
        .map(({ _dist, ...p }) => p)
    },
    [persons],
  )

  const getCityPersons = useCallback(
    (cityId: string) => persons.filter((p) => p.cityId === cityId),
    [persons],
  )

  const getDistrictPersons = useCallback(
    (districtId: string) => persons.filter((p) => p.districtId === districtId),
    [persons],
  )

  const value = useMemo(
    () => ({
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
      updatePersonLocation,
      togglePersonAvailability,
      getClosestAvailable,
      getCityPersons,
      getDistrictPersons,
    }),
    [missions, persons, countries, cities, districts, filters, setFilter, filteredPersons, assignPerson, updateMissionStatus, updatePersonLocation, togglePersonAvailability, getClosestAvailable, getCityPersons, getDistrictPersons],
  )

  return (
    <DeliveryContext.Provider value={value}>
      {children}
    </DeliveryContext.Provider>
  )
}

export function useDelivery() {
  const ctx = useContext(DeliveryContext)
  if (!ctx) throw new Error("useDelivery must be used within DeliveryProvider")
  return ctx
}

import { prisma } from "@/lib/prisma"

export interface TaxRate {
  id?: number
  countryId: string
  rate: number
  label: string
}

export async function getTaxRate(countryId: string): Promise<number> {
  try {
    const rate = await prisma.taxRate.findUnique({ where: { countryId } })
    return rate?.rate ?? 19.25
  } catch {
    return 19.25
  }
}

export async function getAllTaxRates(): Promise<TaxRate[]> {
  try {
    return await prisma.taxRate.findMany({ orderBy: { countryId: "asc" } })
  } catch {
    return []
  }
}

export async function saveTaxRates(rates: TaxRate[]): Promise<void> {
  for (const rate of rates) {
    await prisma.taxRate.upsert({
      where: { countryId: rate.countryId },
      update: { rate: rate.rate, label: rate.label },
      create: { countryId: rate.countryId, rate: rate.rate, label: rate.label },
    })
  }
}

export async function getDefaultTaxRates(): Promise<TaxRate[]> {
  return await getAllTaxRates()
}

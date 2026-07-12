import { queryAll, queryOne, execute } from "@/lib/db"

export interface TaxRate {
  id?: number
  countryId: string
  rate: number
  label: string
}

export async function getTaxRate(countryId: string): Promise<number> {
  try {
    const rate = await queryOne<TaxRate>("SELECT * FROM TaxRate WHERE countryId = ?", [countryId])
    return rate?.rate ?? 19.25
  } catch {
    return 19.25
  }
}

export async function getAllTaxRates(): Promise<TaxRate[]> {
  try {
    return await queryAll<TaxRate>("SELECT * FROM TaxRate ORDER BY countryId ASC")
  } catch {
    return []
  }
}

export async function saveTaxRates(rates: TaxRate[]): Promise<void> {
  for (const rate of rates) {
    const existing = await queryOne<TaxRate>("SELECT * FROM TaxRate WHERE countryId = ?", [rate.countryId])
    if (existing) {
      await execute("UPDATE TaxRate SET rate = ?, label = ? WHERE countryId = ?", [rate.rate, rate.label, rate.countryId])
    } else {
      await execute("INSERT INTO TaxRate (countryId, rate, label) VALUES (?, ?, ?)", [rate.countryId, rate.rate, rate.label])
    }
  }
}

export async function getDefaultTaxRates(): Promise<TaxRate[]> {
  return await getAllTaxRates()
}

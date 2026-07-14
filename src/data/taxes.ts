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
  if (rates.length === 0) return
  const placeholders = rates.map(() => "(?, ?, ?)").join(",")
  const flatParams = rates.flatMap(r => [r.countryId, r.rate, r.label])
  await execute(
    `INSERT INTO TaxRate (countryId, rate, label) VALUES ${placeholders}
     ON DUPLICATE KEY UPDATE rate = VALUES(rate), label = VALUES(label)`,
    flatParams
  )
}

export async function getDefaultTaxRates(): Promise<TaxRate[]> {
  return await getAllTaxRates()
}

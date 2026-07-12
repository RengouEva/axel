import { queryAll, queryOne } from "@/lib/db"
import { cached } from "@/lib/cache"

export interface Category {
  id: number
  name: string
  slug: string
  icon: string
}

export async function getCategories(): Promise<Category[]> {
  return cached("categories", () => queryAll<Category>("SELECT * FROM Category ORDER BY id ASC"), 3_600_000)
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  return cached(`category:${slug}`, () => queryOne<Category>("SELECT * FROM Category WHERE slug = ?", [slug]), 3_600_000)
}

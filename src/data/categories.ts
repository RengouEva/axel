import { queryAll, queryOne } from "@/lib/db"

export interface Category {
  id: number
  name: string
  slug: string
  icon: string
}

export async function getCategories(): Promise<Category[]> {
  return await queryAll<Category>("SELECT * FROM Category ORDER BY id ASC")
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  return await queryOne<Category>("SELECT * FROM Category WHERE slug = ?", [slug])
}

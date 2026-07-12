import { prisma } from "@/lib/prisma"

export interface Category {
  id: number
  name: string
  slug: string
  icon: string
}

export async function getCategories(): Promise<Category[]> {
  return await prisma.category.findMany({
    orderBy: { id: "asc" },
  })
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  return await prisma.category.findUnique({
    where: { slug },
  })
}

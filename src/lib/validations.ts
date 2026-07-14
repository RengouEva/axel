import { z } from "zod"

export const loginSchema = z.object({
  email: z.string().email("Email invalide").max(255),
  password: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères").max(128),
})

export const registerSchema = z.object({
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères").max(100),
  email: z.string().email("Email invalide").max(255),
  password: z
    .string()
    .min(8, "Le mot de passe doit contenir au moins 8 caractères")
    .max(128)
    .regex(/[A-Z]/, "Le mot de passe doit contenir au moins une majuscule")
    .regex(/[a-z]/, "Le mot de passe doit contenir au moins une minuscule")
    .regex(/[0-9]/, "Le mot de passe doit contenir au moins un chiffre"),
  role: z.enum(["client", "seller"]).default("client"),
})

export const productCreateSchema = z.object({
  name: z.string().min(1, "Le nom est requis").max(200),
  brand: z.string().min(1, "La marque est requise").max(100),
  category: z.string().min(1, "La catégorie est requise").max(100),
  price: z.number().int().positive("Le prix doit être positif"),
  description: z.string().max(5000).optional(),
  image: z.string().max(500).optional(),
  images: z.string().max(5000).optional(),
  creditMonths: z.number().int().min(1).max(48).optional(),
  creditRates: z.string().max(1000).optional(),
  inStock: z.boolean().optional(),
  promotion: z.boolean().optional(),
})

export const productUpdateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  brand: z.string().min(1).max(100).optional(),
  category: z.string().min(1).max(100).optional(),
  price: z.number().int().positive().optional(),
  description: z.string().max(5000).optional(),
  image: z.string().max(500).optional(),
  images: z.string().max(5000).optional(),
  creditMonths: z.number().int().min(1).max(48).optional(),
  creditRates: z.string().max(1000).optional(),
  inStock: z.boolean().optional(),
  promotion: z.boolean().optional(),
})

export const orderCreateSchema = z.object({
  total: z.number().int().positive("Le total doit être positif"),
  items: z
    .array(
      z.object({
        productId: z.number().int().positive(),
        name: z.string().min(1),
        quantity: z.number().int().positive(),
        price: z.number().int().positive(),
      })
    )
    .min(1, "Au moins un article est requis"),
  shipping: z
    .object({
      name: z.string().max(200).optional(),
      email: z.string().email().max(255).optional(),
      telephone: z.string().max(20).optional(),
      address: z.string().max(500).optional(),
      countryId: z.string().optional(),
      cityId: z.string().optional(),
      districtId: z.string().optional(),
      method: z.string().optional(),
    })
    .optional(),
})

export const creditSimulateSchema = z.object({
  price: z.number().int().positive("Le prix doit être positif"),
  duration: z.number().int().min(3, "Durée minimale: 3 mois").max(36, "Durée maximale: 36 mois"),
  monthlyIncome: z.number().int().positive().optional(),
})

export const guarantorSchema = z.object({
  fullName: z.string().min(2, "Le nom doit contenir au moins 2 caractères").max(100),
  phone: z.string().min(8, "Téléphone invalide").max(20),
  email: z.string().max(255).optional().or(z.literal("")),
  address: z.string().min(5, "L'adresse est requise").max(500),
  idType: z.enum(["CNI", "Passeport", "Permis"] as const, "Type de pièce requis"),
  idDocument: z.string().min(1, "La pièce d'identité est requise"),
  relationship: z.enum(["Parent", "Conjoint(e)", "Ami(e)", "Collègue", "Autre"] as const, "Lien avec le garant requis"),
})

export const creditApplicationSchema = z.object({
  price: z.number().int().positive("Le prix doit être positif"),
  duration: z.number().int().min(3, "Durée minimale: 3 mois").max(36, "Durée maximale: 36 mois"),
  monthlyIncome: z.number().int().positive("Revenu mensuel requis"),
  applicant: z.object({
    fullName: z.string().min(2, "Le nom doit contenir au moins 2 caractères").max(100),
    email: z.string().email("Email invalide").max(255),
    phone: z.string().min(8, "Téléphone invalide").max(20),
  }),
  guarantors: z.array(guarantorSchema).min(2, "2 garants sont requis").max(2, "2 garants maximum"),
})

export const deliveryCreateSchema = z.object({
  orderId: z.string().min(1, "L'ID de commande est requis"),
  countryId: z.string().min(1, "Le pays est requis"),
  cityId: z.string().optional(),
  districtId: z.string().optional(),
  deliveryAddress: z.string().max(500).optional(),
  customerName: z.string().max(200).optional(),
  customerPhone: z.string().max(20).optional(),
})

export const deliveryAssignSchema = z.object({
  missionId: z.string().min(1),
  personId: z.string().min(1),
})

export const deliveryStatusSchema = z.object({
  missionId: z.string().min(1),
  status: z.enum(["pending", "assigned", "picked_up", "in_transit", "delivered", "cancelled"]),
})

export const contactMessageSchema = z.object({
  name: z.string().min(1, "Le nom est requis").max(100),
  email: z.string().email("Email invalide").max(255),
  subject: z.string().min(1, "L'objet est requis").max(200),
  message: z.string().min(10, "Le message doit contenir au moins 10 caractères").max(2000),
})

export const shopCreateSchema = z.object({
  name: z.string().min(1, "Le nom est requis").max(200),
  description: z.string().max(2000).optional(),
  phone: z.string().max(20).optional(),
  email: z.string().email("Email invalide").max(255).optional(),
  countryId: z.string().min(1, "Le pays est requis"),
  cityId: z.string().optional(),
  districtId: z.string().optional(),
  address: z.string().max(500).optional(),
  category: z.string().min(1, "La catégorie est requise"),
})

export const shopUpdateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  phone: z.string().max(20).optional(),
  email: z.string().email().max(255).optional(),
  countryId: z.string().min(1).optional(),
  cityId: z.string().min(1).optional(),
  districtId: z.string().min(1).optional(),
  address: z.string().max(500).optional(),
  category: z.string().min(1).optional(),
})

export const planCreateSchema = z.object({
  name: z.string().min(1, "Le nom est requis").max(100),
  slug: z.string().min(1, "Le slug est requis").max(100),
  description: z.string().max(2000).default(""),
  price: z.number().int().min(0, "Le prix doit être positif"),
  durationDays: z.number().int().positive("La durée doit être positive"),
  maxBoosts: z.number().int().min(0).default(0),
  hasPremiumBadge: z.boolean().default(false),
  hasVerifiedBadge: z.boolean().default(false),
  hasFeaturedBadge: z.boolean().default(false),
  boostPrice: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
})

export const planUpdateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  slug: z.string().min(1).max(100).optional(),
  description: z.string().max(2000).optional(),
  price: z.number().int().min(0).optional(),
  durationDays: z.number().int().positive().optional(),
  maxBoosts: z.number().int().min(0).optional(),
  hasPremiumBadge: z.boolean().optional(),
  hasVerifiedBadge: z.boolean().optional(),
  hasFeaturedBadge: z.boolean().optional(),
  boostPrice: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
})

export const adCampaignCreateSchema = z.object({
  name: z.string().min(1, "Le nom est requis").max(200),
  type: z.enum(["sponsored_product", "sponsored_shop", "banner", "event"]),
  objective: z.string().optional(),
  productId: z.number().int().positive().nullable().optional(),
  shopId: z.string().min(1, "La boutique est requise"),
  budget: z.number().int().min(0, "Le budget doit être positif"),
  dailyBudget: z.number().int().min(0).optional(),
  startDate: z.string().min(1, "La date de début est requise"),
  endDate: z.string().min(1, "La date de fin est requise"),
  targetCountry: z.string().nullable().optional(),
  targetCategory: z.string().nullable().optional(),
  targetCity: z.string().nullable().optional(),
  bannerImage: z.string().nullable().optional(),
  bannerUrl: z.string().nullable().optional(),
  placements: z.array(z.object({
    id: z.string().min(1),
    bid: z.number().int().min(0).default(0),
  })).optional(),
  isBooster: z.boolean().optional(),
  durationDays: z.number().int().positive().optional(),
})

export const adCampaignUpdateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  objective: z.string().optional(),
  budget: z.number().int().min(0).optional(),
  dailyBudget: z.number().int().min(0).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  targetCountry: z.string().optional(),
  targetCategory: z.string().optional(),
  targetCity: z.string().optional(),
  productId: z.number().int().positive().optional(),
  bannerImage: z.string().optional(),
  bannerUrl: z.string().optional(),
  status: z.enum(["active", "paused", "cancelled"]).optional(),
})

export const adServeQuerySchema = z.object({
  slot: z.string().min(1, "Le slot est requis"),
  country: z.string().optional(),
  category: z.string().optional(),
  city: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(10).default(3),
  exclude: z.string().optional(),
})

export const adClickSchema = z.object({
  campaignId: z.string().min(1),
  placementId: z.string().optional(),
  sessionId: z.string().optional(),
  userId: z.number().int().positive().optional(),
})

export const adPlacementUpdateSchema = z.object({
  slot: z.string().min(1).optional(),
  label: z.string().min(1).optional(),
  isActive: z.boolean().optional(),
  auctionEnabled: z.boolean().optional(),
  basePrice: z.number().int().min(0).optional(),
})

export const adminVerificationActionSchema = z.object({
  action: z.enum(["approve", "reject"]),
  reason: z.string().optional(),
})

export const adminReturnUpdateSchema = z.object({
  status: z.enum(["pending", "approved", "rejected", "picked_up", "received", "refunded", "cancelled"]),
  reviewedBy: z.number().int().positive(),
  refundAmount: z.number().int().min(0).optional(),
  refundMethod: z.string().optional(),
  notes: z.string().optional(),
})

export const adminScoreSchema = z.object({
  productId: z.number().int().positive(),
  score: z.number().int().min(0).max(1000),
  reason: z.string().max(500).optional(),
})

export const adminPremiumSchema = z.object({
  planId: z.number().int().positive(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
})

export function validateInput<T>(schema: z.ZodSchema<T>, data: unknown): {
  success: true
  data: T
} | {
  success: false
  error: string
} {
  const result = schema.safeParse(data)
  if (result.success) {
    return { success: true, data: result.data }
  }
  const firstError = result.error.issues[0]
  return { success: false, error: firstError.message }
}

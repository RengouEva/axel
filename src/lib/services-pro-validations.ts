import { z } from "zod"

export const verificationSubmitSchema = z.object({
  verificationType: z.enum(["individual", "business"]),
  idType: z.string().optional(),
  idNumber: z.string().min(1, "Numéro de pièce requis"),
  businessRegNumber: z.string().optional(),
  taxId: z.string().optional(),
  documents: z.array(z.string()).optional(),
})

export const variantSchema = z.object({
  productId: z.number().int().positive(),
  name: z.string().min(1, "Le nom de la variante est requis").max(100),
  value: z.string().min(1, "La valeur est requise").max(100),
  sku: z.string().max(100).optional(),
  price: z.number().int().positive().optional(),
  stock: z.number().int().min(0).default(0),
  image: z.string().max(500).optional(),
})

export const scheduledPublishSchema = z.object({
  productId: z.number().int().positive(),
  scheduledAt: z.string().min(1, "La date de publication est requise"),
})

export const stockAlertSchema = z.object({
  productId: z.number().int().positive(),
  threshold: z.number().int().min(1, "Le seuil doit être d'au moins 1"),
})

export const returnRequestSchema = z.object({
  orderId: z.string().min(1, "ID de commande requis"),
  productId: z.number().int().positive(),
  reason: z.string().min(10, "Veuillez expliquer le motif du retour").max(2000),
  documents: z.array(z.string()).optional(),
})

export const returnReviewSchema = z.object({
  requestId: z.string().min(1),
  status: z.enum(["approved", "rejected", "picked_up", "received", "refunded"]),
  refundAmount: z.number().int().positive().optional(),
  refundMethod: z.string().optional(),
  notes: z.string().max(1000).optional(),
})

export const shopSettingsSchema = z.object({
  hours: z.record(z.string(), z.object({
    open: z.string(),
    close: z.string(),
  })).optional(),
  socialLinks: z.record(z.string(), z.string().url()).optional(),
  deliveryPolicy: z.string().max(5000).optional(),
  returnPolicy: z.string().max(5000).optional(),
  contactInfo: z.record(z.string(), z.string()).optional(),
  seoDescription: z.string().max(300).optional(),
  seoKeywords: z.string().max(500).optional(),
})

export const promoCodeSchema = z.object({
  code: z.string().min(1, "Le code est requis").max(50).transform(s => s.toUpperCase()),
  discountType: z.enum(["percentage", "fixed"]),
  discountValue: z.number().int().positive("La valeur doit être positive"),
  minPurchase: z.number().int().min(0).default(0),
  maxUses: z.number().int().min(0).default(0),
  applicableProducts: z.array(z.number()).optional(),
  applicableCategories: z.array(z.string()).optional(),
  startDate: z.string().min(1, "Date de début requise"),
  endDate: z.string().min(1, "Date de fin requise"),
})

export const flashSaleSchema = z.object({
  name: z.string().min(1, "Le nom est requis").max(255),
  description: z.string().max(1000).optional(),
  discountPercent: z.number().int().min(1, "Minimum 1%").max(100, "Maximum 100%"),
  productIds: z.array(z.number().int().positive()).min(1, "Au moins un produit requis"),
  startDate: z.string().min(1, "Date de début requise"),
  endDate: z.string().min(1, "Date de fin requise"),
})

export const productPackSchema = z.object({
  name: z.string().min(1, "Le nom est requis").max(255),
  description: z.string().max(1000).optional(),
  products: z.array(z.object({
    productId: z.number().int().positive(),
    quantity: z.number().int().positive(),
  })).min(2, "Au moins 2 produits requis"),
  packPrice: z.number().int().positive("Le prix du pack doit être positif"),
  stock: z.number().int().min(0).default(0),
  image: z.string().max(500).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
})

export const bogoOfferSchema = z.object({
  name: z.string().min(1, "Le nom est requis").max(255),
  buyQuantity: z.number().int().positive(),
  getQuantity: z.number().int().positive(),
  discountPercent: z.number().int().min(0).max(100).default(100),
  applicableProducts: z.array(z.number()).optional(),
  startDate: z.string().min(1, "Date de début requise"),
  endDate: z.string().min(1, "Date de fin requise"),
})

export const messageSchema = z.object({
  userId: z.number().int().positive(),
  orderId: z.string().optional(),
  subject: z.string().min(1, "L'objet est requis").max(255),
  message: z.string().min(1, "Le message est requis").max(5000),
})

export const messageReplySchema = z.object({
  messageId: z.string().min(1),
  message: z.string().min(1, "Le message est requis").max(5000),
})

export const autoReplySchema = z.object({
  keyword: z.string().min(1, "Le mot-clé est requis").max(100),
  replySubject: z.string().max(255).optional(),
  replyMessage: z.string().min(1, "Le message est requis").max(2000),
  matchType: z.enum(["exact", "contains", "regex"]).default("contains"),
})

export const messageTemplateSchema = z.object({
  name: z.string().min(1, "Le nom est requis").max(100),
  subject: z.string().min(1, "L'objet est requis").max(255),
  body: z.string().min(1, "Le contenu est requis").max(5000),
  category: z.string().max(50).default("general"),
})

export const apiKeySchema = z.object({
  name: z.string().min(1, "Le nom est requis").max(100),
  permissions: z.array(z.string()).min(1, "Au moins une permission requise"),
  allowedIps: z.array(z.string()).optional(),
  rateLimit: z.number().int().min(1).max(10000).default(100),
  expiresAt: z.string().optional(),
})

export const teamMemberSchema = z.object({
  email: z.string().email("Email invalide"),
  role: z.enum(["manager", "editor", "support", "analyst"]),
  permissions: z.array(z.string()).optional(),
})

export const securitySettingsSchema = z.object({
  twoFactorEnabled: z.boolean().optional(),
  twoFactorMethod: z.enum(["app", "email", "sms"]).optional(),
  sessionTimeout: z.number().int().min(5).max(480).optional(),
  ipWhitelist: z.array(z.string()).optional(),
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

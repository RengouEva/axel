export interface SellerVerification {
  id: string
  shopId: string
  status: 'pending' | 'approved' | 'rejected' | 'expired'
  verificationType: 'individual' | 'business'
  idType?: string
  idNumber?: string
  businessRegNumber?: string
  taxId?: string
  documents?: string[]
  verifiedBy?: number
  verifiedAt?: string
  expiresAt?: string
  rejectionReason?: string
  createdAt: string
}

export interface ProductVariant {
  id: number
  productId: number
  name: string
  value: string
  sku?: string
  price?: number
  stock: number
  image?: string
  sortOrder: number
}

export interface ProductVariantGroup {
  id: number
  productId: number
  type: string
  name: string
  sortOrder: number
}

export interface ScheduledPublish {
  id: number
  productId: number
  scheduledAt: string
  publishedAt?: string
  status: 'pending' | 'published' | 'cancelled'
}

export interface StockAlert {
  id: number
  productId: number
  shopId: string
  threshold: number
  notified: boolean
  lastNotifiedAt?: string
}

export interface ReturnRequest {
  id: string
  orderId: string
  productId: number
  shopId: string
  userId: number
  productName?: string
  userName?: string
  reason: string
  status: 'pending' | 'approved' | 'rejected' | 'picked_up' | 'received' | 'refunded' | 'cancelled'
  refundAmount?: number
  refundMethod?: string
  documents?: string[]
  notes?: string
  reviewedBy?: number
  reviewedAt?: string
  refundedAt?: string
  createdAt: string
}

export interface ShopSettings {
  shopId: string
  hours?: Record<string, { open: string; close: string }>
  socialLinks?: Record<string, string>
  deliveryPolicy?: string
  returnPolicy?: string
  contactInfo?: Record<string, string>
  seoDescription?: string
  seoKeywords?: string
}

export interface PromoCode {
  id: string
  shopId: string
  code: string
  discountType: 'percentage' | 'fixed'
  discountValue: number
  minPurchase: number
  maxUses: number
  usedCount: number
  applicableProducts?: number[]
  applicableCategories?: string[]
  startDate: string
  endDate: string
  isActive: boolean
}

export interface FlashSale {
  id: string
  shopId: string
  name: string
  description?: string
  discountPercent: number
  startDate: string
  endDate: string
  isActive: boolean
  products?: number[]
}

export interface ProductPack {
  id: string
  shopId: string
  name: string
  description?: string
  products: { productId: number; quantity: number }[]
  packPrice: number
  originalPrice: number
  stock: number
  image?: string
  isActive: boolean
}

export interface BogoOffer {
  id: string
  shopId: string
  name: string
  buyQuantity: number
  getQuantity: number
  discountPercent: number
  applicableProducts?: number[]
  startDate: string
  endDate: string
  isActive: boolean
}

export interface SellerMessage {
  id: string
  shopId: string
  userId: number
  userName?: string
  orderId?: string
  subject: string
  message: string
  senderRole: 'seller' | 'client'
  isRead: boolean
  replies?: SellerMessageReply[]
  createdAt: string
}

export interface SellerMessageReply {
  id: number
  messageId: string
  senderRole: 'seller' | 'client'
  message: string
  createdAt: string
}

export interface AutoReply {
  id: number
  shopId: string
  keyword: string
  replySubject?: string
  replyMessage: string
  matchType: 'exact' | 'contains' | 'regex'
  isActive: boolean
}

export interface MessageTemplate {
  id: number
  shopId: string
  name: string
  subject: string
  body: string
  category: string
}

export interface SellerReport {
  id: string
  shopId: string
  type: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom'
  period: string
  data: ReportData
  pdfPath?: string
  generatedAt: string
}

export interface ReportData {
  revenue: number
  orders: number
  visitors: number
  conversionRate: number
  averageOrderValue: number
  topProducts: { id: number; name: string; sales: number; revenue: number }[]
  revenueByDay?: { date: string; amount: number }[]
  orderStatusBreakdown?: Record<string, number>
}

export interface ApiKey {
  id: string
  shopId: string
  name: string
  keyPrefix: string
  permissions: string[]
  allowedIps?: string[]
  rateLimit: number
  lastUsedAt?: string
  expiresAt?: string
  isActive: boolean
  createdAt: string
}

export interface AiRecommendation {
  id: number
  shopId: string
  productId?: number
  productName?: string
  type: 'price' | 'optimization' | 'publishing' | 'sales_forecast' | 'detection'
  title: string
  description?: string
  data: any
  confidence: number
  applied: boolean
  dismissed: boolean
  createdAt: string
}

export interface SellerNotification {
  id: string
  shopId: string
  type: 'new_order' | 'payment_received' | 'low_stock' | 'return_request' | 'new_message' | 'new_review' | 'performance' | 'system'
  title: string
  message?: string
  data?: any
  isRead: boolean
  createdAt: string
}

export interface SellerSecurity {
  shopId: string
  twoFactorEnabled: boolean
  twoFactorMethod: 'app' | 'email' | 'sms'
  sessionTimeout: number
  ipWhitelist?: string[]
}

export interface LoginLog {
  id: number
  userId: number
  ip: string
  userAgent?: string
  country?: string
  city?: string
  device?: string
  success: boolean
  failReason?: string
  createdAt: string
}

export interface ActionLog {
  id: number
  shopId?: string
  userId: number
  userName?: string
  action: string
  entityType?: string
  entityId?: string
  details?: any
  ip?: string
  createdAt: string
}

export interface TeamMember {
  id: number
  shopId: string
  userId: number
  userName?: string
  userEmail?: string
  role: 'manager' | 'editor' | 'support' | 'analyst'
  permissions?: string[]
  status: 'active' | 'invited' | 'suspended' | 'removed'
  invitedBy?: number
  createdAt: string
}

export interface DashboardStats {
  revenue: { total: number; change: number }
  orders: { total: number; change: number }
  visitors: { total: number; change: number }
  conversionRate: { value: number; change: number }
  topProducts: { id: number; name: string; views: number; sales: number }[]
  topSelling: { id: number; name: string; quantity: number; revenue: number }[]
  revenueByPeriod: { period: string; amount: number }[]
  performance: { date: string; revenue: number; orders: number; visitors: number }[]
}

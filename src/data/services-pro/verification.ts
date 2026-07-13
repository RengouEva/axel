import { queryOne, queryAll, execute } from "@/lib/db"
import type { SellerVerification } from "@/lib/services-pro-types"

export async function getVerification(shopId: string): Promise<SellerVerification | null> {
  return queryOne<SellerVerification>(
    "SELECT * FROM SellerVerification WHERE shopId = ?",
    [shopId]
  )
}

export async function submitVerification(shopId: string, data: {
  verificationType: string
  idType?: string
  idNumber: string
  businessRegNumber?: string
  taxId?: string
  documents?: string[]
}): Promise<SellerVerification | null> {
  const existing = await getVerification(shopId)
  if (existing) {
    await execute(
      `UPDATE SellerVerification SET status = 'pending', verificationType = ?, idType = ?, idNumber = ?,
       businessRegNumber = ?, taxId = ?, documents = ?, updatedAt = NOW()
       WHERE shopId = ?`,
      [data.verificationType, data.idType || null, data.idNumber,
       data.businessRegNumber || null, data.taxId || null,
       data.documents ? JSON.stringify(data.documents) : null, shopId]
    )
  } else {
    const id = `VERIF-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 8)}`.toUpperCase()
    await execute(
      `INSERT INTO SellerVerification (id, shopId, status, verificationType, idType, idNumber,
        businessRegNumber, taxId, documents)
       VALUES (?, ?, 'pending', ?, ?, ?, ?, ?, ?)`,
      [id, shopId, data.verificationType, data.idType || null, data.idNumber,
       data.businessRegNumber || null, data.taxId || null,
       data.documents ? JSON.stringify(data.documents) : null]
    )
  }
  return getVerification(shopId)
}

export async function approveVerification(id: string, verifiedBy: number): Promise<void> {
  const now = new Date()
  const expiresAt = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000)
  await execute(
    `UPDATE SellerVerification SET status = 'approved', verifiedBy = ?, verifiedAt = NOW(), expiresAt = ?
     WHERE id = ?`,
    [verifiedBy, expiresAt, id]
  )
  const verif = await queryOne<any>("SELECT shopId FROM SellerVerification WHERE id = ?", [id])
  if (verif) {
    await execute(
      `INSERT INTO ShopBadge (id, shopId, type, label, color, icon, assignedBy)
       VALUES (?, ?, 'verified', 'Vendeur Vérifié', '#10B981', 'ShieldCheck', 'system')
       ON DUPLICATE KEY UPDATE label = 'Vendeur Vérifié', color = '#10B981'`,
      [`BADGE-VERIF-${verif.shopId}`, verif.shopId]
    )
  }
}

export async function rejectVerification(id: string, reason: string, reviewedBy: number): Promise<void> {
  await execute(
    `UPDATE SellerVerification SET status = 'rejected', rejectionReason = ?, reviewedBy = ?, reviewedAt = NOW()
     WHERE id = ?`,
    [reason, reviewedBy, id]
  )
}

export async function getPendingVerifications(): Promise<SellerVerification[]> {
  return queryAll<SellerVerification>(
    `SELECT sv.*, s.name as shopName, s.email as shopEmail
     FROM SellerVerification sv JOIN Shop s ON s.id = sv.shopId
     WHERE sv.status = 'pending' ORDER BY sv.createdAt ASC`
  )
}

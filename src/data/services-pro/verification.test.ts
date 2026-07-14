import { describe, it, expect, vi, beforeEach } from "vitest"
import {
  getVerification,
  submitVerification,
  approveVerification,
  rejectVerification,
  getPendingVerifications,
} from "./verification"

const mockQueryOne = vi.fn()
const mockQueryAll = vi.fn()
const mockExecute = vi.fn()

vi.mock("@/lib/db", () => ({
  queryOne: (...args: unknown[]) => mockQueryOne(...args),
  queryAll: (...args: unknown[]) => mockQueryAll(...args),
  execute: (...args: unknown[]) => mockExecute(...args),
}))

beforeEach(() => {
  vi.clearAllMocks()
})

describe("getVerification", () => {
  it("returns null when no verification exists", async () => {
    mockQueryOne.mockResolvedValueOnce(null)

    const result = await getVerification("shop-1")

    expect(result).toBeNull()
    expect(mockQueryOne).toHaveBeenCalledWith(
      "SELECT * FROM SellerVerification WHERE shopId = ?",
      ["shop-1"]
    )
  })

  it("returns verification data when found", async () => {
    const mockData = { id: "VERIF-001", shopId: "shop-1", status: "pending" }
    mockQueryOne.mockResolvedValueOnce(mockData)

    const result = await getVerification("shop-1")

    expect(result).toEqual(mockData)
    expect(mockQueryOne).toHaveBeenCalledWith(
      "SELECT * FROM SellerVerification WHERE shopId = ?",
      ["shop-1"]
    )
  })
})

describe("submitVerification", () => {
  const data = {
    verificationType: "individual",
    idType: "national_id",
    idNumber: "ID-12345",
    businessRegNumber: "BRN-001",
    taxId: "TAX-001",
    documents: ["doc1.pdf", "doc2.pdf"],
  }

  it("creates a new verification when none exists", async () => {
    mockQueryOne.mockResolvedValueOnce(null)
    mockExecute.mockResolvedValueOnce({ insertId: "new-id" })
    const created = { id: "VERIF-NEW", shopId: "shop-1", status: "pending" }
    mockQueryOne.mockResolvedValueOnce(created)

    const result = await submitVerification("shop-1", data)

    expect(result).toEqual(created)
    expect(mockQueryOne).toHaveBeenNthCalledWith(
      1,
      "SELECT * FROM SellerVerification WHERE shopId = ?",
      ["shop-1"]
    )
    expect(mockExecute).toHaveBeenCalledWith(
      `INSERT INTO SellerVerification (id, shopId, status, verificationType, idType, idNumber,
        businessRegNumber, taxId, documents)
       VALUES (?, ?, 'pending', ?, ?, ?, ?, ?, ?)`,
      [expect.any(String), "shop-1", "individual", "national_id", "ID-12345",
       "BRN-001", "TAX-001", JSON.stringify(["doc1.pdf", "doc2.pdf"])]
    )
  })

  it("updates an existing verification when one exists", async () => {
    const existing = { id: "VERIF-001", shopId: "shop-1", status: "pending" }
    mockQueryOne.mockResolvedValueOnce(existing)
    mockExecute.mockResolvedValueOnce(undefined)
    const updated = { ...existing, idType: "passport" }
    mockQueryOne.mockResolvedValueOnce(updated)

    const result = await submitVerification("shop-1", data)

    expect(result).toEqual(updated)
    expect(mockExecute).toHaveBeenCalledWith(
      `UPDATE SellerVerification SET status = 'pending', verificationType = ?, idType = ?, idNumber = ?,
       businessRegNumber = ?, taxId = ?, documents = ?, updatedAt = NOW()
       WHERE shopId = ?`,
      ["individual", "national_id", "ID-12345",
       "BRN-001", "TAX-001", JSON.stringify(["doc1.pdf", "doc2.pdf"]), "shop-1"]
    )
  })

  it("handles optional fields as null when not provided", async () => {
    const minimalData = {
      verificationType: "business",
      idNumber: "ID-999",
    }
    mockQueryOne.mockResolvedValueOnce(null)
    mockExecute.mockResolvedValueOnce({ insertId: "new-id" })
    const created = { id: "VERIF-NEW", shopId: "shop-2", status: "pending" }
    mockQueryOne.mockResolvedValueOnce(created)

    await submitVerification("shop-2", minimalData)

    expect(mockExecute).toHaveBeenCalledWith(
      `INSERT INTO SellerVerification (id, shopId, status, verificationType, idType, idNumber,
        businessRegNumber, taxId, documents)
       VALUES (?, ?, 'pending', ?, ?, ?, ?, ?, ?)`,
      [expect.any(String), "shop-2", "business", null, "ID-999", null, null, null]
    )
  })
})

describe("approveVerification", () => {
  it("updates status to approved and creates ShopBadge", async () => {
    mockExecute.mockResolvedValueOnce(undefined)
    mockQueryOne.mockResolvedValueOnce({ shopId: "shop-1" })
    mockExecute.mockResolvedValueOnce(undefined)

    await approveVerification("VERIF-001", 42)

    expect(mockExecute).toHaveBeenNthCalledWith(
      1,
      `UPDATE SellerVerification SET status = 'approved', verifiedBy = ?, verifiedAt = NOW(), expiresAt = ?
     WHERE id = ?`,
      [42, expect.any(Date), "VERIF-001"]
    )
    expect(mockQueryOne).toHaveBeenCalledWith(
      "SELECT shopId FROM SellerVerification WHERE id = ?",
      ["VERIF-001"]
    )
    expect(mockExecute).toHaveBeenNthCalledWith(
      2,
      `INSERT INTO ShopBadge (id, shopId, type, label, color, icon, assignedBy)
       VALUES (?, ?, 'verified', 'Vendeur Vérifié', '#10B981', 'ShieldCheck', 'system')
       ON DUPLICATE KEY UPDATE label = 'Vendeur Vérifié', color = '#10B981'`,
      ["BADGE-VERIF-shop-1", "shop-1"]
    )
  })

  it("does not create ShopBadge when verification not found", async () => {
    mockExecute.mockResolvedValueOnce(undefined)
    mockQueryOne.mockResolvedValueOnce(null)

    await approveVerification("VERIF-MISSING", 1)

    expect(mockExecute).toHaveBeenCalledTimes(1)
    expect(mockQueryOne).toHaveBeenCalledWith(
      "SELECT shopId FROM SellerVerification WHERE id = ?",
      ["VERIF-MISSING"]
    )
  })
})

describe("rejectVerification", () => {
  it("updates status to rejected with reason and reviewer", async () => {
    mockExecute.mockResolvedValueOnce(undefined)

    await rejectVerification("VERIF-001", "Invalid documents", 7)

    expect(mockExecute).toHaveBeenCalledWith(
      `UPDATE SellerVerification SET status = 'rejected', rejectionReason = ?, reviewedBy = ?, reviewedAt = NOW()
     WHERE id = ?`,
      ["Invalid documents", 7, "VERIF-001"]
    )
  })
})

describe("getPendingVerifications", () => {
  it("returns only pending verifications ordered by createdAt ASC", async () => {
    const pendingList = [
      { id: "VERIF-001", shopId: "shop-1", status: "pending", shopName: "Shop One" },
      { id: "VERIF-002", shopId: "shop-2", status: "pending", shopName: "Shop Two" },
    ]
    mockQueryAll.mockResolvedValueOnce(pendingList)

    const result = await getPendingVerifications()

    expect(result).toEqual(pendingList)
    expect(mockQueryAll).toHaveBeenCalledWith(
      `SELECT sv.*, s.name as shopName, s.email as shopEmail
     FROM SellerVerification sv JOIN Shop s ON s.id = sv.shopId
     WHERE sv.status = 'pending' ORDER BY sv.createdAt ASC`
    )
  })

  it("returns empty array when no pending verifications", async () => {
    mockQueryAll.mockResolvedValueOnce([])

    const result = await getPendingVerifications()

    expect(result).toEqual([])
  })
})

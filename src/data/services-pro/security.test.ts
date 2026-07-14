import { describe, it, expect, vi, beforeEach } from "vitest"
import {
  getSecuritySettings,
  enableTwoFactor,
  disableTwoFactor,
  getLoginLogs,
  logLogin,
  logAction,
  getTeamMembers,
  addTeamMember,
  removeTeamMember,
  getSecurityScore,
} from "./security"

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

describe("getSecuritySettings", () => {
  it("returns security settings for a shop", async () => {
    const settings = { shopId: "shop1", twoFactorEnabled: true, twoFactorMethod: "app", sessionTimeout: 60 }
    mockQueryOne.mockResolvedValue(settings)

    const result = await getSecuritySettings("shop1")

    expect(result).toEqual(settings)
    expect(mockQueryOne).toHaveBeenCalledWith(
      "SELECT * FROM SellerSecurity WHERE shopId = ?",
      ["shop1"]
    )
  })

  it("returns null when shop has no security settings", async () => {
    mockQueryOne.mockResolvedValue(null)

    const result = await getSecuritySettings("nonexistent")

    expect(result).toBeNull()
  })
})

describe("enableTwoFactor", () => {
  it("updates existing security record with 2FA fields", async () => {
    mockQueryOne.mockResolvedValue({ shopId: "shop1" })
    mockExecute.mockResolvedValue({ affectedRows: 1 })

    await enableTwoFactor("shop1", "app", "JBSWY3DPEHPK3PXP")

    expect(mockQueryOne).toHaveBeenCalledWith(
      "SELECT shopId FROM SellerSecurity WHERE shopId = ?",
      ["shop1"]
    )
    expect(mockExecute).toHaveBeenCalledWith(
      "UPDATE SellerSecurity SET twoFactorEnabled = 1, twoFactorMethod = ?, twoFactorSecret = ? WHERE shopId = ?",
      ["app", "JBSWY3DPEHPK3PXP", "shop1"]
    )
  })

  it("inserts security record if none exists", async () => {
    mockQueryOne.mockResolvedValue(null)
    mockExecute.mockResolvedValue({ affectedRows: 1 })

    await enableTwoFactor("shop2", "email", "SECRET123")

    expect(mockExecute).toHaveBeenCalledWith(
      "INSERT INTO SellerSecurity (shopId, twoFactorEnabled, twoFactorMethod, twoFactorSecret) VALUES (?, 1, ?, ?)",
      ["shop2", "email", "SECRET123"]
    )
  })
})

describe("disableTwoFactor", () => {
  it("disables 2FA and clears method and secret", async () => {
    mockExecute.mockResolvedValue({ affectedRows: 1 })

    await disableTwoFactor("shop1")

    expect(mockExecute).toHaveBeenCalledWith(
      "UPDATE SellerSecurity SET twoFactorEnabled = 0, twoFactorMethod = NULL, twoFactorSecret = NULL WHERE shopId = ?",
      ["shop1"]
    )
  })
})

describe("getLoginLogs", () => {
  it("returns login logs for a user with default limit", async () => {
    const logs = [
      { id: 1, userId: 42, ip: "192.168.1.1", success: true, createdAt: "2024-01-01" },
    ]
    mockQueryAll.mockResolvedValue(logs)

    const result = await getLoginLogs(42)

    expect(result).toEqual(logs)
    expect(mockQueryAll).toHaveBeenCalledWith(
      "SELECT * FROM LoginLog WHERE userId = ? ORDER BY createdAt DESC LIMIT ?",
      [42, 50]
    )
  })

  it("respects custom limit parameter", async () => {
    mockQueryAll.mockResolvedValue([])

    await getLoginLogs(42, 10)

    expect(mockQueryAll).toHaveBeenCalledWith(
      expect.any(String),
      [42, 10]
    )
  })
})

describe("logLogin", () => {
  it("creates a login log entry with all fields", async () => {
    mockExecute.mockResolvedValue({ affectedRows: 1 })

    await logLogin(42, {
      ip: "192.168.1.1",
      userAgent: "Mozilla/5.0",
      success: true,
      sessionId: "abc123",
    })

    expect(mockExecute).toHaveBeenCalledWith(
      `INSERT INTO LoginLog (userId, ip, userAgent, success, failReason, sessionId)
     VALUES (?, ?, ?, ?, ?, ?)`,
      [42, "192.168.1.1", "Mozilla/5.0", 1, null, "abc123"]
    )
  })

  it("creates a login log entry without optional fields", async () => {
    mockExecute.mockResolvedValue({ affectedRows: 1 })

    await logLogin(42, { ip: "10.0.0.1", success: false, failReason: "Invalid password" })

    expect(mockExecute).toHaveBeenCalledWith(
      `INSERT INTO LoginLog (userId, ip, userAgent, success, failReason, sessionId)
     VALUES (?, ?, ?, ?, ?, ?)`,
      [42, "10.0.0.1", null, 0, "Invalid password", null]
    )
  })
})

describe("logAction", () => {
  it("creates an action log with all fields and JSON.stringify for details", async () => {
    mockExecute.mockResolvedValue({ affectedRows: 1 })
    const details = { price: 29.99, stock: 10 }

    await logAction("shop1", 42, {
      action: "update_product",
      entityType: "product",
      entityId: "prod-1",
      details,
      ip: "192.168.1.1",
      userAgent: "Mozilla/5.0",
    })

    expect(mockExecute).toHaveBeenCalledWith(
      `INSERT INTO ActionLog (shopId, userId, action, entityType, entityId, details, ip, userAgent)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      ["shop1", 42, "update_product", "product", "prod-1", JSON.stringify(details), "192.168.1.1", "Mozilla/5.0"]
    )
  })

  it("creates an action log with no optional fields", async () => {
    mockExecute.mockResolvedValue({ affectedRows: 1 })

    await logAction(undefined, 42, { action: "login" })

    expect(mockExecute).toHaveBeenCalledWith(
      `INSERT INTO ActionLog (shopId, userId, action, entityType, entityId, details, ip, userAgent)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [null, 42, "login", null, null, null, null, null]
    )
  })
})

describe("getTeamMembers", () => {
  it("returns team members with user name and email", async () => {
    const members = [
      { id: 1, shopId: "shop1", userId: 10, userName: "Alice", userEmail: "alice@test.com", role: "manager", status: "active", createdAt: "2024-01-01" },
      { id: 2, shopId: "shop1", userId: 11, userName: "Bob", userEmail: "bob@test.com", role: "editor", status: "active", createdAt: "2024-01-02" },
    ]
    mockQueryAll.mockResolvedValue(members)

    const result = await getTeamMembers("shop1")

    expect(result).toEqual(members)
    expect(mockQueryAll).toHaveBeenCalledWith(
      `SELECT tm.*, u.name as userName, u.email as userEmail
     FROM TeamMember tm JOIN User u ON u.id = tm.userId
     WHERE tm.shopId = ? ORDER BY tm.createdAt ASC`,
      ["shop1"]
    )
  })

  it("returns empty array when shop has no team members", async () => {
    mockQueryAll.mockResolvedValue([])

    const result = await getTeamMembers("empty-shop")

    expect(result).toEqual([])
  })
})

describe("addTeamMember", () => {
  it("inserts a team member with the given role", async () => {
    mockExecute.mockResolvedValue({ affectedRows: 1, insertId: 5 })

    await addTeamMember("shop1", 42, "editor")

    expect(mockExecute).toHaveBeenCalledWith(
      "INSERT INTO TeamMember (shopId, userId, role, status) VALUES (?, ?, ?, 'active')",
      ["shop1", 42, "editor"]
    )
  })
})

describe("removeTeamMember", () => {
  it("sets team member status to removed", async () => {
    mockExecute.mockResolvedValue({ affectedRows: 1 })

    await removeTeamMember(1)

    expect(mockExecute).toHaveBeenCalledWith(
      "UPDATE TeamMember SET status = 'removed' WHERE id = ?",
      [1]
    )
  })
})

describe("getSecurityScore", () => {
  it("returns 0 when 2FA is disabled and no team members exist", async () => {
    mockQueryOne.mockResolvedValue({ shopId: "shop1", twoFactorEnabled: false, twoFactorMethod: "app", sessionTimeout: 60 })
    mockQueryAll.mockResolvedValue([])

    const result = await getSecurityScore("shop1")

    expect(result).toBe(0)
    expect(mockQueryOne).toHaveBeenCalledWith(
      "SELECT * FROM SellerSecurity WHERE shopId = ?",
      ["shop1"]
    )
    expect(mockQueryAll).toHaveBeenCalledWith(
      "SELECT id FROM TeamMember WHERE shopId = ? AND status = 'active'",
      ["shop1"]
    )
  })

  it("returns 70 with 2FA enabled and 3 active team members (40 + 30)", async () => {
    mockQueryOne.mockResolvedValue({ shopId: "shop1", twoFactorEnabled: true, twoFactorMethod: "app", sessionTimeout: 60 })
    mockQueryAll.mockResolvedValue([{ id: 1 }, { id: 2 }, { id: 3 }])

    const result = await getSecurityScore("shop1")

    expect(result).toBe(70)
  })

  it("caps team member bonus at 30 even with 10 team members (40 + 30)", async () => {
    mockQueryOne.mockResolvedValue({ shopId: "shop1", twoFactorEnabled: true, twoFactorMethod: "app", sessionTimeout: 60 })
    const tenMembers = Array.from({ length: 10 }, (_, i) => ({ id: i + 1 }))
    mockQueryAll.mockResolvedValue(tenMembers)

    const result = await getSecurityScore("shop1")

    expect(result).toBe(70)
  })
})

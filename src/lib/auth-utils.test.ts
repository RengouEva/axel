import { describe, it, expect, beforeAll, afterAll } from "vitest"
import {
  hashPassword,
  verifyPassword,
  createToken,
  verifyToken,
  generateOrderId,
  generateMissionId,
} from "./auth-utils"

const ORIGINAL_ENV = process.env.JWT_SECRET

beforeAll(() => {
  process.env.JWT_SECRET = "test-secret-key-for-unit-tests-32chars!"
})

afterAll(() => {
  if (ORIGINAL_ENV !== undefined) {
    process.env.JWT_SECRET = ORIGINAL_ENV
  } else {
    delete process.env.JWT_SECRET
  }
})

describe("auth-utils", () => {
  describe("hashPassword / verifyPassword", () => {
    it("hashes a password", async () => {
      const hash = await hashPassword("mypassword")
      expect(hash).toBeTruthy()
      expect(hash).not.toBe("mypassword")
      expect(hash.length).toBeGreaterThan(20)
    })

    it("verifies correct password", async () => {
      const hash = await hashPassword("mypassword")
      expect(await verifyPassword("mypassword", hash)).toBe(true)
    })

    it("rejects incorrect password", async () => {
      const hash = await hashPassword("mypassword")
      expect(await verifyPassword("wrongpassword", hash)).toBe(false)
    })
  })

  describe("createToken / verifyToken", () => {
    it("creates and verifies a valid token", async () => {
      const token = await createToken({ userId: 1, email: "test@test.com", role: "client" })
      expect(token).toBeTruthy()
      expect(typeof token).toBe("string")

      const payload = await verifyToken(token)
      expect(payload).not.toBeNull()
      expect(payload!.userId).toBe(1)
      expect(payload!.email).toBe("test@test.com")
      expect(payload!.role).toBe("client")
    })

    it("rejects invalid token", async () => {
      const result = await verifyToken("invalid.token.here")
      expect(result).toBeNull()
    })

    it("rejects token with wrong secret", async () => {
      process.env.JWT_SECRET = "test-secret-key-for-unit-tests-32chars!"
      const token = await createToken({ userId: 1, email: "test@test.com", role: "client" })

      process.env.JWT_SECRET = "different-secret-key-for-testing-32!"
      const result = await verifyToken(token)
      expect(result).toBeNull()

      process.env.JWT_SECRET = "test-secret-key-for-unit-tests-32chars!"
    })
  })

  describe("generateOrderId", () => {
    it("starts with AXEL-", () => {
      expect(generateOrderId()).toMatch(/^AXEL-/)
    })

    it("generates unique IDs", () => {
      const ids = new Set(Array.from({ length: 100 }, () => generateOrderId()))
      expect(ids.size).toBe(100)
    })
  })

  describe("generateMissionId", () => {
    it("starts with MISSION-", () => {
      expect(generateMissionId()).toMatch(/^MISSION-/)
    })

    it("generates unique IDs", () => {
      const ids = new Set(Array.from({ length: 100 }, () => generateMissionId()))
      expect(ids.size).toBe(100)
    })
  })
})

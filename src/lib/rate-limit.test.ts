import { describe, it, expect, beforeEach, vi } from "vitest"
import {
  checkRateLimit,
  checkAuthRateLimit,
  checkApiRateLimit,
  getRateLimitHeaders,
} from "./rate-limit"

describe("rate-limit", () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.restoreAllMocks()
  })

  describe("checkRateLimit", () => {
    it("allows first request", () => {
      const result = checkRateLimit("test-ip", { windowMs: 60000, maxRequests: 5 })
      expect(result.allowed).toBe(true)
      expect(result.remaining).toBe(4)
    })

    it("increments count on successive requests", () => {
      const id = "increment-test"
      const config = { windowMs: 60000, maxRequests: 3 }
      checkRateLimit(id, config)
      checkRateLimit(id, config)
      const third = checkRateLimit(id, config)
      expect(third.allowed).toBe(true)
      expect(third.remaining).toBe(0)
    })

    it("blocks when limit exceeded", () => {
      const id = "block-test"
      const config = { windowMs: 60000, maxRequests: 2 }
      checkRateLimit(id, config)
      checkRateLimit(id, config)
      const result = checkRateLimit(id, config)
      expect(result.allowed).toBe(false)
      expect(result.remaining).toBe(0)
    })

    it("resets after window expires", () => {
      const id = "reset-test"
      const config = { windowMs: 1000, maxRequests: 1 }
      checkRateLimit(id, config)
      const blocked = checkRateLimit(id, config)
      expect(blocked.allowed).toBe(false)

      vi.advanceTimersByTime(1100)

      const afterReset = checkRateLimit(id, config)
      expect(afterReset.allowed).toBe(true)
      expect(afterReset.remaining).toBe(0)
    })
  })

  describe("checkAuthRateLimit", () => {
    it("uses auth prefix", () => {
      const result = checkAuthRateLimit("192.168.1.1")
      expect(result.allowed).toBe(true)
    })
  })

  describe("checkApiRateLimit", () => {
    it("uses api prefix", () => {
      const result = checkApiRateLimit("192.168.1.1")
      expect(result.allowed).toBe(true)
    })
  })

  describe("getRateLimitHeaders", () => {
    it("returns standard headers when allowed", () => {
      const headers = getRateLimitHeaders({ allowed: true, remaining: 59, resetTime: Date.now() + 60000 })
      expect(headers["X-RateLimit-Remaining"]).toBe("59")
      expect(headers["Retry-After"]).toBeUndefined()
    })

    it("includes Retry-After when blocked", () => {
      const headers = getRateLimitHeaders({ allowed: false, remaining: 0, resetTime: Date.now() + 30000 })
      expect(headers["Retry-After"]).toBeTruthy()
      expect(Number(headers["Retry-After"])).toBeGreaterThan(0)
    })
  })
})

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import {
  loginSchema,
  registerSchema,
  productCreateSchema,
  productUpdateSchema,
  orderCreateSchema,
  creditSimulateSchema,
  deliveryCreateSchema,
  deliveryAssignSchema,
  deliveryStatusSchema,
  contactMessageSchema,
  validateInput,
} from "./validations"

describe("validateInput", () => {
  it("returns success with valid data", () => {
    const result = validateInput(loginSchema, { email: "test@test.com", password: "12345678" })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.email).toBe("test@test.com")
    }
  })

  it("returns error with invalid data", () => {
    const result = validateInput(loginSchema, { email: "bad", password: "short" })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toBeTruthy()
    }
  })
})

describe("loginSchema", () => {
  it("accepts valid login", () => {
    expect(loginSchema.safeParse({ email: "test@test.com", password: "12345678" }).success).toBe(true)
  })

  it("rejects invalid email", () => {
    expect(loginSchema.safeParse({ email: "bad", password: "12345678" }).success).toBe(false)
  })

  it("rejects short password", () => {
    expect(loginSchema.safeParse({ email: "test@test.com", password: "123" }).success).toBe(false)
  })
})

describe("registerSchema", () => {
  const valid = { name: "Test User", email: "test@test.com", password: "Password1" }

  it("accepts valid registration", () => {
    expect(registerSchema.safeParse(valid).success).toBe(true)
  })

  it("requires uppercase in password", () => {
    expect(registerSchema.safeParse({ ...valid, password: "password1" }).success).toBe(false)
  })

  it("requires lowercase in password", () => {
    expect(registerSchema.safeParse({ ...valid, password: "PASSWORD1" }).success).toBe(false)
  })

  it("requires digit in password", () => {
    expect(registerSchema.safeParse({ ...valid, password: "Password" }).success).toBe(false)
  })

  it("requires name >= 2 chars", () => {
    expect(registerSchema.safeParse({ ...valid, name: "T" }).success).toBe(false)
  })
})

describe("productCreateSchema", () => {
  it("accepts valid product", () => {
    const result = productCreateSchema.safeParse({
      name: "Smartphone",
      brand: "Samsung",
      category: "Téléphone",
      price: 250000,
    })
    expect(result.success).toBe(true)
  })

  it("rejects negative price", () => {
    expect(productCreateSchema.safeParse({
      name: "Smartphone", brand: "Samsung", category: "Téléphone", price: -100,
    }).success).toBe(false)
  })

  it("rejects empty name", () => {
    expect(productCreateSchema.safeParse({
      name: "", brand: "Samsung", category: "Téléphone", price: 100,
    }).success).toBe(false)
  })
})

describe("orderCreateSchema", () => {
  it("accepts valid order with items", () => {
    const result = orderCreateSchema.safeParse({
      total: 50000,
      items: [{ productId: 1, name: "Smartphone", quantity: 1, price: 50000 }],
    })
    expect(result.success).toBe(true)
  })

  it("rejects empty items array", () => {
    expect(orderCreateSchema.safeParse({
      total: 50000, items: [],
    }).success).toBe(false)
  })

  it("rejects negative total", () => {
    expect(orderCreateSchema.safeParse({
      total: -1,
      items: [{ productId: 1, name: "Smartphone", quantity: 1, price: 50000 }],
    }).success).toBe(false)
  })
})

describe("creditSimulateSchema", () => {
  it("accepts valid credit simulation", () => {
    expect(creditSimulateSchema.safeParse({ price: 500000, duration: 12 }).success).toBe(true)
  })

  it("rejects duration < 3 months", () => {
    expect(creditSimulateSchema.safeParse({ price: 500000, duration: 2 }).success).toBe(false)
  })

  it("rejects duration > 36 months", () => {
    expect(creditSimulateSchema.safeParse({ price: 500000, duration: 37 }).success).toBe(false)
  })
})

describe("deliveryCreateSchema", () => {
  it("accepts valid delivery", () => {
    expect(deliveryCreateSchema.safeParse({
      orderId: "AXEL-123-ABC",
      countryId: "CM",
      cityId: "DLA",
      districtId: "DLA-CT",
    }).success).toBe(true)
  })

  it("rejects missing required fields", () => {
    expect(deliveryCreateSchema.safeParse({}).success).toBe(false)
  })
})

describe("deliveryAssignSchema", () => {
  it("accepts valid assignment", () => {
    expect(deliveryAssignSchema.safeParse({ missionId: "M1", personId: "P1" }).success).toBe(true)
  })

  it("rejects missing fields", () => {
    expect(deliveryAssignSchema.safeParse({ missionId: "M1" }).success).toBe(false)
  })
})

describe("deliveryStatusSchema", () => {
  it("accepts valid status", () => {
    expect(deliveryStatusSchema.safeParse({ missionId: "M1", status: "in_transit" }).success).toBe(true)
  })

  it("rejects invalid status", () => {
    expect(deliveryStatusSchema.safeParse({ missionId: "M1", status: "unknown" }).success).toBe(false)
  })
})

describe("contactMessageSchema", () => {
  it("accepts valid contact message", () => {
    expect(contactMessageSchema.safeParse({
      name: "John",
      email: "john@test.com",
      subject: "Question",
      message: "This is a test message with enough chars.",
    }).success).toBe(true)
  })

  it("rejects short message", () => {
    expect(contactMessageSchema.safeParse({
      name: "John",
      email: "john@test.com",
      subject: "Question",
      message: "Short",
    }).success).toBe(false)
  })
})

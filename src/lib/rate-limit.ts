const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

interface RateLimitConfig {
  windowMs: number
  maxRequests: number
}

const DEFAULT_CONFIG: RateLimitConfig = {
  windowMs: 60 * 1000,
  maxRequests: 60,
}

const AUTH_CONFIG: RateLimitConfig = {
  windowMs: 15 * 60 * 1000,
  maxRequests: 10,
}

export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig = DEFAULT_CONFIG
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now()
  const record = rateLimitMap.get(identifier)

  if (!record || now > record.resetTime) {
    rateLimitMap.set(identifier, {
      count: 1,
      resetTime: now + config.windowMs,
    })
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetTime: now + config.windowMs,
    }
  }

  if (record.count >= config.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: record.resetTime,
    }
  }

  record.count++
  return {
    allowed: true,
    remaining: config.maxRequests - record.count,
    resetTime: record.resetTime,
  }
}

export function checkAuthRateLimit(identifier: string): {
  allowed: boolean
  remaining: number
  resetTime: number
} {
  return checkRateLimit(`auth:${identifier}`, AUTH_CONFIG)
}

export function checkApiRateLimit(identifier: string): {
  allowed: boolean
  remaining: number
  resetTime: number
} {
  return checkRateLimit(`api:${identifier}`, DEFAULT_CONFIG)
}

export function getRateLimitHeaders(
  result: { allowed: boolean; remaining: number; resetTime: number }
): Record<string, string> {
  const headers: Record<string, string> = {
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": String(Math.ceil(result.resetTime / 1000)),
  }
  if (!result.allowed) {
    headers["Retry-After"] = String(Math.ceil((result.resetTime - Date.now()) / 1000))
  }
  return headers
}

const store = new Map<string, { data: unknown; expiry: number }>()

export function getCached<T>(key: string): T | undefined {
  const hit = store.get(key)
  if (hit && hit.expiry > Date.now()) return hit.data as T
  store.delete(key)
  return undefined
}

export function setCache<T>(key: string, data: T, ttlMs: number): void {
  store.set(key, { data, expiry: Date.now() + ttlMs })
  if (store.size > 500) {
    const first = store.keys().next().value
    if (first) store.delete(first)
  }
}

export async function cached<T>(key: string, fn: () => Promise<T>, ttlMs = 60_000): Promise<T> {
  const existing = getCached<T>(key)
  if (existing !== undefined) return existing
  const data = await fn()
  setCache(key, data, ttlMs)
  return data
}

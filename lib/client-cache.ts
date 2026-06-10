// lib/client-cache.ts

export interface ClientCacheEntry {
  data: any
  timestamp: number
}

const clientCache = new Map<string, ClientCacheEntry>()

// Valid for 5 minutes
const CACHE_VALID_MS = 5 * 60 * 1000

export function getClientCachedData(key: string): any | null {
  const cached = clientCache.get(key)
  if (!cached) return null
  
  const isExpired = Date.now() - cached.timestamp > CACHE_VALID_MS
  if (isExpired) {
    clientCache.delete(key)
    return null
  }
  return cached.data
}

export function setClientCachedData(key: string, data: any): void {
  clientCache.set(key, { data, timestamp: Date.now() })
}

export function clearClientCache(): void {
  clientCache.clear()
}

// lib/cache.ts

export interface CacheResult<T> {
  data: T
  cachedAt: string
  expiresAt: string
  isCached: boolean
}

// Global server-side cache map
const cacheMap = new Map<string, CacheResult<any>>()

// Default TTL: 6 hours (21600 seconds)
const CACHE_TTL_MS = (Number(process.env.ADS_CACHE_TTL_SECONDS) || 21600) * 1000

// Stale limit: 24 hours
const STALE_LIMIT_MS = 24 * 60 * 60 * 1000

/**
 * Retrieves data from the cache, or fetches and stores it if it is missing, expired, or bypassed.
 * Implements Stale-While-Revalidate (SWR) logic for expired cache within the stale limit.
 * 
 * @param key Unique key for caching, e.g. "meta_overview_2026-05-01_2026-05-31"
 * @param fetchFn Asynchronous fetch function that generates the data if not cached
 * @param bypassCache If true, forces refetching and updates cache
 */
export async function getOrSetCache<T>(
  key: string,
  fetchFn: () => Promise<T>,
  bypassCache: boolean = false,
  customTtlMs?: number
): Promise<CacheResult<T>> {
  const now = Date.now()
  const ttl = customTtlMs !== undefined ? customTtlMs : CACHE_TTL_MS

  if (!bypassCache) {
    const cached = cacheMap.get(key)
    if (cached) {
      const expiresTime = new Date(cached.expiresAt).getTime()
      
      // Cache is completely fresh
      if (expiresTime > now) {
        return {
          ...cached,
          isCached: true
        }
      }
      
      // Cache is stale but within the stale revalidation limit -> Return stale instantly and revalidate in background
      if (now - expiresTime < STALE_LIMIT_MS) {
        fetchFn()
          .then((freshData) => {
            const cachedAtStr = new Date().toISOString()
            const expiresAtStr = new Date(Date.now() + ttl).toISOString()
            cacheMap.set(key, {
              data: freshData,
              cachedAt: cachedAtStr,
              expiresAt: expiresAtStr,
              isCached: false
            })
          })
          .catch((err) => {
            console.error(`SWR Background revalidation failed for key ${key}:`, err)
          })

        return {
          ...cached,
          isCached: true
        }
      }
    }
  }

  // Cache miss or past stale window limit -> block fetch synchronously
  const data = await fetchFn()
  
  const cachedAt = new Date().toISOString()
  const expiresAt = new Date(now + ttl).toISOString()

  const result: CacheResult<T> = {
    data,
    cachedAt,
    expiresAt,
    isCached: false
  }

  cacheMap.set(key, result)
  return result
}

/**
 * Clears a specific cache entry (useful for granular resets)
 */
export function invalidateCacheKey(key: string): void {
  cacheMap.delete(key)
}

/**
 * Clears the entire server-side cache
 */
export function clearAllCache(): void {
  cacheMap.clear()
}

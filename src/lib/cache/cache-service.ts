/**
 * Cache Service
 * High-level caching operations with TTL management and statistics
 */

import { getRedisClient } from "./redis-client";
import { logger } from "../logger";

export interface CacheStats {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  errors: number;
  hitRate: number;
}

// In-memory stats (persisted to Redis periodically)
let stats: CacheStats = {
  hits: 0,
  misses: 0,
  sets: 0,
  deletes: 0,
  errors: 0,
  hitRate: 0,
};

/**
 * Get value from cache
 */
export async function cacheGet<T>(key: string): Promise<T | null> {
  const client = getRedisClient();
  if (!client) {
    return null;
  }

  try {
    const value = await client.get(key);
    if (value) {
      stats.hits++;
      return JSON.parse(value) as T;
    } else {
      stats.misses++;
      return null;
    }
  } catch (error) {
    stats.errors++;
    logger.error("Cache get error", { key, error });
    return null;
  }
}

/**
 * Set value in cache with TTL
 */
export async function cacheSet(
  key: string,
  value: any,
  ttl?: number
): Promise<boolean> {
  const client = getRedisClient();
  if (!client) {
    return false;
  }

  try {
    const serialized = JSON.stringify(value);
    if (ttl) {
      await client.setex(key, ttl, serialized);
    } else {
      await client.set(key, serialized);
    }
    stats.sets++;
    return true;
  } catch (error) {
    stats.errors++;
    logger.error("Cache set error", { key, error });
    return false;
  }
}

/**
 * Delete value from cache
 */
export async function cacheDelete(key: string): Promise<boolean> {
  const client = getRedisClient();
  if (!client) {
    return false;
  }

  try {
    await client.del(key);
    stats.deletes++;
    return true;
  } catch (error) {
    stats.errors++;
    logger.error("Cache delete error", { key, error });
    return false;
  }
}

/**
 * Delete multiple keys matching a pattern
 */
export async function cacheDeletePattern(pattern: string): Promise<number> {
  const client = getRedisClient();
  if (!client) {
    return 0;
  }

  try {
    const keys = await client.keys(pattern);
    if (keys.length === 0) {
      return 0;
    }

    const deleted = await client.del(...keys);
    stats.deletes += deleted;
    return deleted;
  } catch (error) {
    stats.errors++;
    logger.error("Cache delete pattern error", { pattern, error });
    return 0;
  }
}

/**
 * Check if key exists in cache
 */
export async function cacheExists(key: string): Promise<boolean> {
  const client = getRedisClient();
  if (!client) {
    return false;
  }

  try {
    const exists = await client.exists(key);
    return exists === 1;
  } catch (error) {
    stats.errors++;
    logger.error("Cache exists error", { key, error });
    return false;
  }
}

/**
 * Get multiple values from cache
 */
export async function cacheGetMany<T>(keys: string[]): Promise<(T | null)[]> {
  const client = getRedisClient();
  if (!client || keys.length === 0) {
    return keys.map(() => null);
  }

  try {
    const values = await client.mget(...keys);
    return values.map((value) => {
      if (value) {
        stats.hits++;
        return JSON.parse(value) as T;
      } else {
        stats.misses++;
        return null;
      }
    });
  } catch (error) {
    stats.errors++;
    logger.error("Cache get many error", { keys, error });
    return keys.map(() => null);
  }
}

/**
 * Set multiple values in cache
 */
export async function cacheSetMany(
  entries: Array<{ key: string; value: any; ttl?: number }>
): Promise<boolean> {
  const client = getRedisClient();
  if (!client || entries.length === 0) {
    return false;
  }

  try {
    const pipeline = client.pipeline();

    for (const entry of entries) {
      const serialized = JSON.stringify(entry.value);
      if (entry.ttl) {
        pipeline.setex(entry.key, entry.ttl, serialized);
      } else {
        pipeline.set(entry.key, serialized);
      }
    }

    await pipeline.exec();
    stats.sets += entries.length;
    return true;
  } catch (error) {
    stats.errors++;
    logger.error("Cache set many error", { count: entries.length, error });
    return false;
  }
}

/**
 * Increment a counter in cache
 */
export async function cacheIncrement(
  key: string,
  amount = 1
): Promise<number | null> {
  const client = getRedisClient();
  if (!client) {
    return null;
  }

  try {
    const value = await client.incrby(key, amount);
    return value;
  } catch (error) {
    stats.errors++;
    logger.error("Cache increment error", { key, error });
    return null;
  }
}

/**
 * Get cache statistics
 */
export function getCacheStats(): CacheStats {
  const total = stats.hits + stats.misses;
  stats.hitRate = total > 0 ? (stats.hits / total) * 100 : 0;
  return { ...stats };
}

/**
 * Reset cache statistics
 */
export function resetCacheStats(): void {
  stats = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
    errors: 0,
    hitRate: 0,
  };
}

/**
 * Get cache info from Redis
 */
export async function getCacheInfo(): Promise<any> {
  const client = getRedisClient();
  if (!client) {
    return null;
  }

  try {
    const info = await client.info("stats");
    const dbSize = await client.dbsize();
    const memory = await client.info("memory");

    return {
      stats: info,
      dbSize,
      memory,
    };
  } catch (error) {
    logger.error("Failed to get cache info", { error });
    return null;
  }
}

/**
 * Clear all cache
 */
export async function cacheClearAll(): Promise<boolean> {
  const client = getRedisClient();
  if (!client) {
    return false;
  }

  try {
    await client.flushdb();
    logger.info("Cache cleared");
    return true;
  } catch (error) {
    stats.errors++;
    logger.error("Cache clear error", { error });
    return false;
  }
}

/**
 * Warm cache with data
 */
export async function cacheWarm(
  entries: Array<{ key: string; value: any; ttl?: number }>
): Promise<number> {
  let warmed = 0;

  for (const entry of entries) {
    const success = await cacheSet(entry.key, entry.value, entry.ttl);
    if (success) {
      warmed++;
    }
  }

  logger.info("Cache warmed", { count: warmed, total: entries.length });
  return warmed;
}

/**
 * Get or set cache value (cache-aside pattern)
 */
export async function cacheGetOrSet<T>(
  key: string,
  fetchFn: () => Promise<T>,
  ttl?: number
): Promise<T | null> {
  // Try to get from cache first
  const cached = await cacheGet<T>(key);
  if (cached !== null) {
    return cached;
  }

  // Fetch from source
  // Note: We re-throw errors instead of returning null so callers can handle them appropriately
  const value = await fetchFn();
  if (value !== null && value !== undefined) {
    await cacheSet(key, value, ttl);
  }
  return value;
}


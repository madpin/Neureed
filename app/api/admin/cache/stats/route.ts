/**
 * Cache Statistics API
 * GET /api/admin/cache/stats - Get cache statistics
 */

import { createHandler } from "@/lib/api-handler";
import { getCacheStats, getCacheInfo } from "@/lib/cache/cache-service";
import { getRedisStatus } from "@/lib/cache/redis-client";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/cache/stats
 * Get cache statistics
 */
export const GET = createHandler(
  async () => {
    const stats = getCacheStats();
    const status = getRedisStatus();
    const info = await getCacheInfo();

    // Calculate hit rate
    const hits = stats.hits || 0;
    const misses = stats.misses || 0;
    const total = hits + misses;
    const hitRate = total > 0 ? (hits / total) * 100 : 0;
    
    // Get keys count from info
    const keys = info?.keys || 0;

    return {
      hits,
      misses,
      keys,
      memory: info?.memory || "0 MB",
      hitRate,
      connected: status.connected,
      enabled: status.enabled,
    };
  },
  { requireAdmin: true }
);


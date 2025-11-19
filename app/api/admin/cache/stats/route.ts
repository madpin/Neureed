/**
 * Cache Statistics API
 * GET /api/admin/cache/stats - Get cache statistics
 */

import { NextRequest } from "next/server";
import { apiResponse, apiError } from "@/lib/api-response";
import { getCacheStats, getCacheInfo } from "@/lib/cache/cache-service";
import { getRedisStatus } from "@/lib/cache/redis-client";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/cache/stats
 * Get cache statistics
 */
export async function GET(_request: NextRequest) {
  try {
    const stats = getCacheStats();
    const status = getRedisStatus();
    const info = await getCacheInfo();

    return apiResponse({
      stats,
      status,
      info,
    });
  } catch (error) {
    console.error("Error fetching cache stats:", error);
    return apiError(
      error instanceof Error ? error.message : "Failed to fetch cache stats",
      500
    );
  }
}


/**
 * Cache Clear API
 * POST /api/admin/cache/clear - Clear cache
 * DELETE /api/admin/cache/clear - Clear specific pattern
 */

import { NextRequest } from "next/server";
import { apiResponse, apiError } from "@/src/lib/api-response";
import {
  cacheClearAll,
  cacheDeletePattern,
} from "@/src/lib/cache/cache-service";
import { z } from "zod";

const clearPatternSchema = z.object({
  pattern: z.string(),
});

/**
 * POST /api/admin/cache/clear
 * Clear all cache
 */
export async function POST(request: NextRequest) {
  try {
    const success = await cacheClearAll();

    if (!success) {
      return apiError("Failed to clear cache", 500);
    }

    return apiResponse({ success: true, message: "Cache cleared" });
  } catch (error) {
    console.error("Error clearing cache:", error);
    return apiError(
      error instanceof Error ? error.message : "Failed to clear cache",
      500
    );
  }
}

/**
 * DELETE /api/admin/cache/clear
 * Clear specific cache pattern
 */
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();

    const validation = clearPatternSchema.safeParse(body);
    if (!validation.success) {
      return apiError("Invalid pattern", 400);
    }

    const { pattern } = validation.data;
    const deleted = await cacheDeletePattern(pattern);

    return apiResponse({
      success: true,
      deleted,
      message: `Deleted ${deleted} keys`,
    });
  } catch (error) {
    console.error("Error clearing cache pattern:", error);
    return apiError(
      error instanceof Error ? error.message : "Failed to clear cache pattern",
      500
    );
  }
}


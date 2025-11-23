/**
 * Summarization Cost Tracking API
 * GET /api/admin/summarization/costs
 */

import { NextRequest, NextResponse } from "next/server";
import { apiResponse, apiError } from "@/lib/api-response";
import { logger } from "@/lib/logger";
import {
  getSummarizationCostStats,
  getRecentSummarizationEntries,
  getUserRecentSummarizationEntries,
  getSummarizationCostReport,
  clearSummarizationCostHistory,
  getUserSummarizationCostStats,
} from "@/lib/services/summarization-cost-tracker";

export const dynamic = "force-dynamic";

/**
 * GET - Get summarization cost statistics
 * Query parameters:
 * - action: "recent" | "report" | "user" (default: stats)
 * - limit: number (default: 100, for "recent" action)
 * - start: ISO date string (for "report" action)
 * - end: ISO date string (for "report" action)
 * - userId: string (for "user" action)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");
    const limit = parseInt(searchParams.get("limit") || "100");

    // Get recent cost entries
    if (action === "recent") {
      const userId = searchParams.get("userId");
      const entries = userId
        ? getUserRecentSummarizationEntries(userId, limit)
        : getRecentSummarizationEntries(limit);
      return apiResponse({ entries, count: entries.length });
    }

    // Get cost report for date range
    if (action === "report") {
      const startDate = searchParams.get("start");
      const endDate = searchParams.get("end");

      if (!startDate || !endDate) {
        return apiError("Missing start or end date", undefined, {
          status: 400,
        });
      }

      const report = getSummarizationCostReport(
        new Date(startDate),
        new Date(endDate)
      );
      return apiResponse(report);
    }

    // Get user-specific stats
    if (action === "user") {
      const userId = searchParams.get("userId");

      if (!userId) {
        return apiError("Missing userId parameter", undefined, {
          status: 400,
        });
      }

      const stats = getUserSummarizationCostStats(userId);
      return apiResponse(stats);
    }

    // Default: return overall stats
    const stats = getSummarizationCostStats();

    // Convert Set to Array for JSON serialization
    const serializedStats = {
      ...stats,
      byProvider: Object.fromEntries(
        Object.entries(stats.byProvider).map(([provider, data]) => [
          provider,
          {
            ...data,
            models: Array.from(data.models),
          },
        ])
      ),
    };

    return apiResponse(serializedStats);
  } catch (error) {
    logger.error("Failed to get summarization cost stats", { error });
    return apiError(
      "Failed to get summarization cost stats",
      error instanceof Error ? error.message : String(error),
      { status: 500 }
    );
  }
}

/**
 * DELETE - Clear summarization cost history
 */
export async function DELETE() {
  try {
    clearSummarizationCostHistory();
    return apiResponse({ message: "Summarization cost history cleared" });
  } catch (error) {
    logger.error("Failed to clear summarization cost history", { error });
    return apiError(
      "Failed to clear summarization cost history",
      error instanceof Error ? error.message : String(error),
      { status: 500 }
    );
  }
}

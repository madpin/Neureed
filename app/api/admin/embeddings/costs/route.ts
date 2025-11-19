/**
 * Embedding Cost Tracking API
 * GET /api/admin/embeddings/costs
 */

import { NextRequest, NextResponse } from "next/server";
import { apiResponse, apiError } from "@/lib/api-response";
import { logger } from "@/lib/logger";
import {
  getCostStats,
  getRecentCostEntries,
  getCostReport,
  clearCostHistory,
} from "@/lib/services/embedding-cost-tracker";

export const dynamic = "force-dynamic";

/**
 * GET - Get cost statistics
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");
    const limit = parseInt(searchParams.get("limit") || "100");

    if (action === "recent") {
      const entries = getRecentCostEntries(limit);
      return apiResponse({ entries, count: entries.length });
    }

    if (action === "report") {
      const startDate = searchParams.get("start");
      const endDate = searchParams.get("end");

      if (!startDate || !endDate) {
        return apiError("Missing start or end date", undefined, {
          status: 400,
        });
      }

      const report = getCostReport(new Date(startDate), new Date(endDate));
      return apiResponse(report);
    }

    // Default: return stats
    const stats = getCostStats();
    return apiResponse(stats);
  } catch (error) {
    logger.error("Failed to get cost stats", { error });
    return apiError(
      "Failed to get cost stats",
      error instanceof Error ? error.message : String(error),
      { status: 500 }
    );
  }
}

/**
 * DELETE - Clear cost history
 */
export async function DELETE() {
  try {
    clearCostHistory();
    return apiResponse({ message: "Cost history cleared" });
  } catch (error) {
    logger.error("Failed to clear cost history", { error });
    return apiError(
      "Failed to clear cost history",
      error instanceof Error ? error.message : String(error),
      { status: 500 }
    );
  }
}


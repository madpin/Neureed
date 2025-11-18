import { NextRequest } from "next/server";
import { z } from "zod";
import { refreshFeeds, refreshAllDueFeeds, getRefreshStats } from "@/src/lib/services/feed-refresh-service";
import { apiResponse, apiError } from "@/src/lib/api-response";

/**
 * Request schema
 */
const refreshFeedsSchema = z.object({
  feedIds: z.array(z.string()).optional(),
  force: z.boolean().optional().default(false),
});

/**
 * POST /api/jobs/refresh-feeds
 * Manually trigger feed refresh
 * 
 * This endpoint should be protected in production with API key or admin auth
 */
export async function POST(request: NextRequest) {
  try {
    // TODO: Add authentication check here
    // const apiKey = request.headers.get("x-api-key");
    // if (!apiKey || apiKey !== process.env.API_KEY) {
    //   return apiError("Unauthorized", 401);
    // }

    // Parse body, defaulting to empty object if no body provided
    let body = {};
    try {
      const text = await request.text();
      if (text) {
        body = JSON.parse(text);
      }
    } catch (e) {
      // If parsing fails, use empty object (all fields are optional)
    }

    // Validate input
    const validationResult = refreshFeedsSchema.safeParse(body);
    if (!validationResult.success) {
      return apiError(
        "Invalid input",
        400,
        validationResult.error.errors
      );
    }

    const { feedIds, force } = validationResult.data;

    let results;
    let stats;

    if (feedIds && feedIds.length > 0) {
      // Refresh specific feeds
      const refreshResults = await refreshFeeds(feedIds);
      stats = getRefreshStats(refreshResults);
      results = refreshResults;
    } else {
      // Refresh all due feeds
      const refreshResult = await refreshAllDueFeeds();
      stats = getRefreshStats(refreshResult.results);
      results = refreshResult.results;
    }

    return apiResponse({
      success: true,
      stats,
      results: results.map((r) => ({
        feedId: r.feedId,
        success: r.success,
        newArticles: r.newArticles,
        updatedArticles: r.updatedArticles,
        error: r.error,
        duration: r.duration,
      })),
    });
  } catch (error) {
    console.error("Error refreshing feeds:", error);
    return apiError(
      "Failed to refresh feeds",
      500,
      error instanceof Error ? error.message : undefined
    );
  }
}

/**
 * GET /api/jobs/refresh-feeds
 * Get refresh job status
 */
export async function GET() {
  try {
    // Return job status info
    return apiResponse({
      status: "ready",
      message: "Feed refresh job is available. Use POST to trigger.",
    });
  } catch (error) {
    console.error("Error getting refresh job status:", error);
    return apiError(
      "Failed to get job status",
      500,
      error instanceof Error ? error.message : undefined
    );
  }
}


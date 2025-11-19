import { z } from "zod";
import { refreshFeeds, refreshAllDueFeeds, getRefreshStats } from "@/lib/services/feed-refresh-service";
import { createHandler } from "@/lib/api-handler";

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
export const POST = createHandler(
  async ({ body }) => {
    // TODO: Add authentication check here
    // const apiKey = request.headers.get("x-api-key");
    // if (!apiKey || apiKey !== process.env.API_KEY) {
    //   throw new Error("Unauthorized");
    // }

    const { feedIds, force } = body;

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

    return {
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
    };
  },
  { bodySchema: refreshFeedsSchema }
);

/**
 * GET /api/jobs/refresh-feeds
 * Get refresh job status
 */
export const GET = createHandler(async () => {
  // Return job status info
  return {
    status: "ready",
    message: "Feed refresh job is available. Use POST to trigger.",
  };
});


import { z } from "zod";
import { refreshFeeds, refreshAllDueFeeds, getRefreshStats } from "@/lib/services/feed-refresh-service";
import { createHandler } from "@/lib/api-handler";
import { createFeedRefreshNotification, cleanupOldNotifications } from "@/lib/services/notification-service";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

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

    // Calculate totals for notifications
    const totalCleaned = results.reduce(
      (sum, r) => sum + (r.cleanupResult?.deleted || 0),
      0
    );
    
    const totalEmbeddings = results.reduce(
      (sum, r) => sum + (r.embeddingsGenerated || 0),
      0
    );
    
    const totalTokens = results.reduce(
      (sum, r) => sum + (r.embeddingTokens || 0),
      0
    );

    // Get all users who have the refreshed feeds
    const refreshedFeedIds = results.map(r => r.feedId);
    if (refreshedFeedIds.length > 0) {
      const userFeeds = await prisma.user_feeds.findMany({
        where: {
          feedId: { in: refreshedFeedIds },
        },
        select: {
          userId: true,
        },
      });

      const affectedUserIds = Array.from(new Set(userFeeds.map(uf => uf.userId)));
      
      // Create notifications for affected users
      for (const userId of affectedUserIds) {
        try {
          await createFeedRefreshNotification(userId, {
            totalFeeds: stats.totalFeeds,
            successful: stats.successful,
            failed: stats.failed,
            newArticles: stats.totalNewArticles,
            updatedArticles: stats.totalUpdatedArticles,
            articlesCleanedUp: totalCleaned,
            embeddingsGenerated: totalEmbeddings > 0 ? totalEmbeddings : undefined,
            totalTokens: totalTokens > 0 ? totalTokens : undefined,
            duration: `${(stats.averageDuration / 1000).toFixed(2)}s`,
          });
          
          // Cleanup old notifications
          await cleanupOldNotifications(userId);
        } catch (error) {
          logger.error(`Failed to create notification for user ${userId}`, { error });
        }
      }
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


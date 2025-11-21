import { createHandler } from "@/lib/api-handler";
import { refreshUserFeeds, getRefreshStats } from "@/lib/services/feed-refresh-service";
import { createFeedRefreshNotification, cleanupOldNotifications } from "@/lib/services/notification-service";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

/**
 * POST /api/user/feeds/refresh
 * Refresh all due feeds for the authenticated user
 * Uses user's configured refresh intervals and cleanup settings
 */
export const POST = createHandler(
  async ({ session }) => {
    const userId = session!.user!.id;
    
    // Refresh user's feeds
    const result = await refreshUserFeeds(userId);
    const stats = getRefreshStats(result.results);

    // Calculate cleanup stats
    const totalCleaned = result.results.reduce(
      (sum, r) => sum + (r.cleanupResult?.deleted || 0),
      0
    );
    
    const totalEmbeddings = result.results.reduce(
      (sum, r) => sum + (r.embeddingsGenerated || 0),
      0
    );
    
    const totalTokens = result.results.reduce(
      (sum, r) => sum + (r.embeddingTokens || 0),
      0
    );

    // Create notification for the user (only if there are new/updated articles)
    if (stats.totalNewArticles > 0 || stats.totalUpdatedArticles > 0) {
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

    return {
      success: true,
      stats: {
        ...stats,
        articlesCleanedUp: totalCleaned,
      },
      results: result.results.map((r) => ({
        feedId: r.feedId,
        success: r.success,
        newArticles: r.newArticles,
        updatedArticles: r.updatedArticles,
        error: r.error,
        duration: r.duration,
        cleanupResult: r.cleanupResult,
      })),
    };
  },
  { requireAuth: true }
);


import { createHandler } from "@/src/lib/api-handler";
import { refreshUserFeeds, getRefreshStats } from "@/src/lib/services/feed-refresh-service";
import { requireAuth } from "@/src/lib/middleware/auth-middleware";

/**
 * POST /api/user/feeds/refresh
 * Refresh all due feeds for the authenticated user
 * Uses user's configured refresh intervals and cleanup settings
 */
export const POST = createHandler(
  async ({ session }) => {
    // Require authentication
    const user = await requireAuth(session);

    // Refresh user's feeds
    const result = await refreshUserFeeds(user.id);
    const stats = getRefreshStats(result.results);

    // Calculate cleanup stats
    const totalCleaned = result.results.reduce(
      (sum, r) => sum + (r.cleanupResult?.deleted || 0),
      0
    );

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
  }
);


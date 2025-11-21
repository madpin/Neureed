import { getFeed } from "@/lib/services/feed-service";
import { refreshFeed } from "@/lib/services/feed-refresh-service";
import { createHandler } from "@/lib/api-handler";
import { createFeedRefreshNotification, cleanupOldNotifications } from "@/lib/services/notification-service";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

/**
 * POST /api/feeds/:id/refresh
 * Manually refresh a feed
 */
export const POST = createHandler(async ({ params, session }) => {
  const { id } = params;
  const userId = session?.user?.id;

  // Check if feed exists
  const feed = await getFeed(id);
  if (!feed) {
    throw new Error("Feed not found");
  }

  // Refresh feed
  const result = await refreshFeed(id, userId);

  if (!result.success) {
    throw new Error(result.error || "Failed to refresh feed");
  }

  // Get all users subscribed to this feed
  const userFeeds = await prisma.user_feeds.findMany({
    where: {
      feedId: id,
    },
    select: {
      userId: true,
    },
  });

  const affectedUserIds = Array.from(new Set(userFeeds.map(uf => uf.userId)));
  
  // Create notifications for affected users (only if there are new/updated articles)
  if (affectedUserIds.length > 0 && (result.newArticles > 0 || result.updatedArticles > 0)) {
    for (const affectedUserId of affectedUserIds) {
      try {
        await createFeedRefreshNotification(affectedUserId, {
          totalFeeds: 1,
          successful: 1,
          failed: 0,
          newArticles: result.newArticles,
          updatedArticles: result.updatedArticles,
          articlesCleanedUp: result.cleanupResult?.deleted || 0,
          embeddingsGenerated: result.embeddingsGenerated || undefined,
          totalTokens: result.embeddingTokens || undefined,
          duration: `${(result.duration / 1000).toFixed(2)}s`,
        });
        
        // Cleanup old notifications
        await cleanupOldNotifications(affectedUserId);
      } catch (error) {
        logger.error(`Failed to create notification for user ${affectedUserId}`, { error });
      }
    }
  }

  return {
    success: true,
    newArticles: result.newArticles,
    updatedArticles: result.updatedArticles,
    duration: result.duration,
    embeddingsGenerated: result.embeddingsGenerated,
    articlesCleanedUp: result.cleanupResult?.deleted || 0,
  };
});


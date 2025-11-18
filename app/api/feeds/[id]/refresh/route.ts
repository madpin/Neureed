import { getFeed } from "@/src/lib/services/feed-service";
import { refreshFeed } from "@/src/lib/services/feed-refresh-service";
import { createHandler } from "@/src/lib/api-handler";

/**
 * POST /api/feeds/:id/refresh
 * Manually refresh a feed
 */
export const POST = createHandler(async ({ params }) => {
  const { id } = params;

  // Check if feed exists
  const feed = await getFeed(id);
  if (!feed) {
    throw new Error("Feed not found");
  }

  // Refresh feed
  const result = await refreshFeed(id);

  if (!result.success) {
    throw new Error(result.error || "Failed to refresh feed");
  }

  return {
    success: true,
    newArticles: result.newArticles,
    updatedArticles: result.updatedArticles,
    duration: result.duration,
  };
});


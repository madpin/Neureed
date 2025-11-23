import { refreshLastArticles } from "@/lib/services/feed-refresh-service";
import { createHandler } from "@/lib/api-handler";
import { z } from "zod";

export const dynamic = "force-dynamic";

const refreshArticlesSchema = z.object({
  count: z.number().min(1).max(50).default(10),
});

/**
 * POST /api/feeds/:id/refresh-articles
 * Refresh the last X articles for a feed
 * Re-extracts content using the current extraction settings
 */
export const POST = createHandler(
  async ({ params, body, session }) => {
    const { id: feedId } = params;
    const { count } = body;
    const userId = session?.user?.id;

    // Refresh articles
    const result = await refreshLastArticles(feedId, count, userId);

    if (!result.success) {
      throw new Error(result.error || "Failed to refresh articles");
    }

    return {
      feedId: result.feedId,
      articlesProcessed: result.articlesProcessed,
      articlesUpdated: result.articlesUpdated,
      articlesFailed: result.articlesFailed,
      embeddingsGenerated: result.embeddingsGenerated,
      embeddingTokens: result.embeddingTokens,
      duration: result.duration,
    };
  },
  {
    bodySchema: refreshArticlesSchema,
    requireAuth: true,
  }
);

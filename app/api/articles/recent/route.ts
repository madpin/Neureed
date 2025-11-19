import { getArticlesByDateRange } from "@/lib/services/article-service";
import { recentArticlesSchema } from "@/lib/validations/article-validation";
import { createHandler } from "@/lib/api-handler";

export const dynamic = "force-dynamic";

/**
 * GET /api/articles/recent
 * Get recent articles within a time window
 */
export const GET = createHandler(
  async ({ query }) => {
    const { limit, hours = 24 } = query;

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - hours * 60 * 60 * 1000);

    // Get articles
    const { articles, total } = await getArticlesByDateRange(
      startDate,
      endDate,
      { limit }
    );

    return {
      articles,
      total,
      timeRange: {
        start: startDate,
        end: endDate,
        hours,
      },
    };
  },
  { querySchema: recentArticlesSchema }
);


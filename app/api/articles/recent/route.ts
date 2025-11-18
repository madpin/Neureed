import { getArticlesByDateRange } from "@/src/lib/services/article-service";
import { recentArticlesSchema } from "@/src/lib/validations/article-validation";
import { createHandler } from "@/src/lib/api-handler";

/**
 * GET /api/articles/recent
 * Get recent articles within a time window
 */
export const GET = createHandler(
  async ({ query }) => {
    const { limit, hours } = query;

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


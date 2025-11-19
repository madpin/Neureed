import { searchArticles } from "@/lib/services/article-service";
import { searchArticlesSchema } from "@/lib/validations/article-validation";
import { createHandler } from "@/lib/api-handler";

/**
 * GET /api/articles/search
 * Search articles by query
 */
export const GET = createHandler(
  async ({ query }) => {
    const { q, page = 1, limit = 20, feedId } = query as any;

    // Search articles
    const { articles, total } = await searchArticles(q, {
      page,
      limit,
      feedId,
    });

    return {
      articles,
      query: q,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },
  { querySchema: searchArticlesSchema }
);


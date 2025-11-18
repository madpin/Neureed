import { searchArticles } from "@/src/lib/services/article-service";
import { searchArticlesSchema } from "@/src/lib/validations/article-validation";
import { createHandler } from "@/src/lib/api-handler";

/**
 * GET /api/articles/search
 * Search articles by query
 */
export const GET = createHandler(
  async ({ query }) => {
    const { q, page, limit, feedId } = query;

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


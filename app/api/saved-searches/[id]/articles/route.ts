/**
 * API Route: /api/saved-searches/[id]/articles
 *
 * GET - Get matching articles for a saved search
 */

import { createHandler } from "@/lib/api-handler";
import { z } from "zod";
import * as savedSearchService from "@/lib/services/saved-search-service";

// Query schema for filtering and pagination
const articlesQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional().default(50).catch(50),
  offset: z.coerce.number().int().min(0).optional().default(0).catch(0),
  sortBy: z.enum(['relevance', 'date', 'combined']).optional().default('relevance').catch('relevance'),
  startDate: z.coerce.date().optional().nullable(),
  endDate: z.coerce.date().optional().nullable(),
  feedIds: z.string().optional().nullable(),
});

type ArticlesQuery = z.infer<typeof articlesQuerySchema>;

/**
 * GET /api/saved-searches/[id]/articles
 * Get matching articles for a saved search
 */
export const GET = createHandler(
  async ({ session, params, query }) => {
    const userId = session!.user.id;
    const { id } = params;
    const { limit, offset, sortBy, startDate, endDate, feedIds } = query as ArticlesQuery;

    // Parse feedIds from comma-separated string
    const feedIdsArray = feedIds ? feedIds.split(',') : undefined;

    const result = await savedSearchService.getMatchingArticles(
      id,
      userId,
      {
        limit,
        offset,
        sortBy,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        feedIds: feedIdsArray,
      }
    );

    return {
      data: {
        articles: result.articles,
        matches: result.matches,
        total: result.total,
        pagination: {
          limit,
          offset,
          hasMore: offset + result.articles.length < result.total,
        },
      },
    };
  },
  {
    requireAuth: true,
    querySchema: articlesQuerySchema,
  }
);

/**
 * Semantic Search API
 * POST /api/articles/semantic-search
 */

import { logger } from "@/lib/logger";
import {
  searchSimilarArticles,
  hybridSearch,
} from "@/lib/services/semantic-search-service";
import { z } from "zod";
import { createHandler } from "@/lib/api-handler";

const searchSchema = z.object({
  query: z.string().min(1, "Query is required"),
  limit: z.number().min(1).max(100).optional().default(20),
  minScore: z.number().min(0).max(1).optional().default(0.7),
  feedIds: z.array(z.string()).optional(),
  since: z.string().datetime().optional(),
  until: z.string().datetime().optional(),
  mode: z.enum(["semantic", "hybrid"]).optional().default("semantic"),
  page: z.number().min(1).optional().default(1),
  recencyWeight: z.number().min(0).max(1).optional().default(0.3),
  recencyDecayDays: z.number().min(1).max(365).optional().default(30),
});

/**
 * POST - Search articles using semantic search
 */
export const POST = createHandler(
  async ({ body }) => {
    logger.info("Semantic search request", {
      query: body.query,
      mode: body.mode,
      limit: body.limit,
      page: body.page,
    });

    const options = {
      limit: body.limit,
      minScore: body.minScore,
      feedIds: body.feedIds,
      since: body.since ? new Date(body.since) : undefined,
      until: body.until ? new Date(body.until) : undefined,
      page: body.page,
      recencyWeight: body.recencyWeight,
      recencyDecayDays: body.recencyDecayDays,
    };

    if (body.mode === "hybrid") {
      const results = await hybridSearch(body.query, options);
      return {
        mode: "hybrid",
        results: results.combined,
        semantic: results.semantic,
        keyword: results.keyword,
        count: results.combined.length,
        pagination: {
          page: body.page,
          limit: body.limit,
          hasMore: results.combined.length === body.limit,
        },
      };
    } else {
      const results = await searchSimilarArticles(body.query, options);
      return {
        mode: "semantic",
        results,
        count: results.length,
        pagination: {
          page: body.page,
          limit: body.limit,
          hasMore: results.length === body.limit,
        },
      };
    }
  },
  { bodySchema: searchSchema }
);


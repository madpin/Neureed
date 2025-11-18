/**
 * Semantic Search API
 * POST /api/articles/semantic-search
 */

import { logger } from "@/src/lib/logger";
import {
  searchSimilarArticles,
  hybridSearch,
} from "@/src/lib/services/semantic-search-service";
import { z } from "zod";
import { createHandler } from "@/src/lib/api-handler";

const searchSchema = z.object({
  query: z.string().min(1, "Query is required"),
  limit: z.number().min(1).max(100).optional().default(10),
  minScore: z.number().min(0).max(1).optional().default(0.7),
  feedIds: z.array(z.string()).optional(),
  since: z.string().datetime().optional(),
  until: z.string().datetime().optional(),
  mode: z.enum(["semantic", "hybrid"]).optional().default("semantic"),
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
    });

    const options = {
      limit: body.limit,
      minScore: body.minScore,
      feedIds: body.feedIds,
      since: body.since ? new Date(body.since) : undefined,
      until: body.until ? new Date(body.until) : undefined,
    };

    if (body.mode === "hybrid") {
      const results = await hybridSearch(body.query, options);
      return {
        mode: "hybrid",
        results: results.combined,
        semantic: results.semantic,
        keyword: results.keyword,
        count: results.combined.length,
      };
    } else {
      const results = await searchSimilarArticles(body.query, options);
      return {
        mode: "semantic",
        results,
        count: results.length,
      };
    }
  },
  { bodySchema: searchSchema }
);


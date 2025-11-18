/**
 * Semantic Search API
 * POST /api/articles/semantic-search
 */

import { NextRequest, NextResponse } from "next/server";
import { apiResponse, apiError } from "@/src/lib/api-response";
import { logger } from "@/src/lib/logger";
import {
  searchSimilarArticles,
  hybridSearch,
} from "@/src/lib/services/semantic-search-service";
import { z } from "zod";

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
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = searchSchema.parse(body);

    logger.info("Semantic search request", {
      query: validated.query,
      mode: validated.mode,
      limit: validated.limit,
    });

    const options = {
      limit: validated.limit,
      minScore: validated.minScore,
      feedIds: validated.feedIds,
      since: validated.since ? new Date(validated.since) : undefined,
      until: validated.until ? new Date(validated.until) : undefined,
    };

    if (validated.mode === "hybrid") {
      const results = await hybridSearch(validated.query, options);
      return apiResponse({
        mode: "hybrid",
        results: results.combined,
        semantic: results.semantic,
        keyword: results.keyword,
        count: results.combined.length,
      });
    } else {
      const results = await searchSimilarArticles(validated.query, options);
      return apiResponse({
        mode: "semantic",
        results,
        count: results.length,
      });
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return apiError("Invalid request", error.errors, { status: 400 });
    }

    logger.error("Semantic search failed", { error });
    return apiError(
      "Search failed",
      error instanceof Error ? error.message : String(error),
      { status: 500 }
    );
  }
}


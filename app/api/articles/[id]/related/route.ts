/**
 * Related Articles API
 * GET /api/articles/:id/related
 */

import { logger } from "@/lib/logger";
import { findRelatedArticles } from "@/lib/services/semantic-search-service";
import { createHandler } from "@/lib/api-handler";
import { apiResponse } from "@/lib/api-response";

export const dynamic = "force-dynamic";

/**
 * GET - Find related articles
 */
export const GET = createHandler(async ({ params, request }) => {
  const { id } = params;
  const { searchParams } = new URL(request.url);

  const limit = parseInt(searchParams.get("limit") || "10");
  const minScore = parseFloat(searchParams.get("minScore") || "0.7");
  const excludeSameFeed = searchParams.get("excludeSameFeed") === "true";

  logger.info("Finding related articles", { articleId: id, limit, minScore });

  try {
    const results = await findRelatedArticles(id, {
      limit,
      minScore,
      excludeSameFeed,
    });

    return {
      articleId: id,
      results,
      count: results.length,
    };
  } catch (error) {
    // Handle "no embedding" error gracefully
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error("Failed to find related articles", { 
      error: error instanceof Error ? { message: error.message, stack: error.stack } : error,
      articleId: id 
    });
    
    if (errorMessage.includes("no embedding")) {
      return apiResponse({
        articleId: id,
        results: [],
        count: 0,
        message: "Article has no embedding. Generate embeddings to enable related articles.",
      });
    }
    
    throw error;
  }
});


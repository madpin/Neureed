/**
 * Related Articles API
 * GET /api/articles/:id/related
 */

import { NextRequest, NextResponse } from "next/server";
import { apiResponse, apiError } from "@/src/lib/api-response";
import { logger } from "@/src/lib/logger";
import { findRelatedArticles } from "@/src/lib/services/semantic-search-service";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET - Find related articles
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const { searchParams } = new URL(request.url);

    const limit = parseInt(searchParams.get("limit") || "10");
    const minScore = parseFloat(searchParams.get("minScore") || "0.7");
    const excludeSameFeed = searchParams.get("excludeSameFeed") === "true";

    logger.info("Finding related articles", { articleId: id, limit, minScore });

    const results = await findRelatedArticles(id, {
      limit,
      minScore,
      excludeSameFeed,
    });

    return apiResponse({
      articleId: id,
      results,
      count: results.length,
    });
  } catch (error) {
    logger.error("Failed to find related articles", { error });
    
    // Handle "no embedding" error gracefully
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (errorMessage.includes("no embedding")) {
      return apiResponse({
        articleId: (await context.params).id,
        results: [],
        count: 0,
        message: "Article has no embedding. Generate embeddings to enable related articles.",
      });
    }
    
    return apiError(
      "Failed to find related articles",
      errorMessage,
      { status: 500 }
    );
  }
}


/**
 * Embedding Management API
 * Admin endpoints for managing embeddings
 */

import { NextRequest, NextResponse } from "next/server";
import { apiResponse, apiError } from "@/lib/api-response";
import { logger } from "@/lib/logger";
import {
  getEmbeddingStats,
  clearAllEmbeddings,
  generateBatchEmbeddings,
  getArticlesWithoutEmbeddings,
} from "@/lib/services/article-embedding-service";

export const dynamic = "force-dynamic";

/**
 * GET - Get embedding statistics
 */
export async function GET() {
  try {
    const stats = await getEmbeddingStats();
    const articlesWithoutEmbeddings = await getArticlesWithoutEmbeddings(10);

    return apiResponse({
      stats,
      sampleArticlesWithoutEmbeddings: articlesWithoutEmbeddings.map((a) => ({
        id: a.id,
        title: a.title,
        feedId: a.feedId,
      })),
    });
  } catch (error) {
    logger.error("Failed to get embedding stats", { error });
    return apiError(
      "Failed to get stats",
      error instanceof Error ? error.message : String(error),
      { status: 500 }
    );
  }
}

/**
 * POST - Generate embeddings for articles
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const articleIds = body.articleIds as string[] | undefined;
    const limit = body.limit || 100;

    if (articleIds && articleIds.length > 0) {
      // Generate for specific articles
      logger.info("Generating embeddings for specific articles", {
        count: articleIds.length,
      });

      const result = await generateBatchEmbeddings(articleIds);

      return apiResponse({
        ...result,
        message: `Generated embeddings for ${result.processed} articles`,
      });
    } else {
      // Generate for articles without embeddings
      logger.info("Generating embeddings for articles without embeddings", {
        limit,
      });

      const articles = await getArticlesWithoutEmbeddings(limit);
      const result = await generateBatchEmbeddings(articles.map((a) => a.id));

      return apiResponse({
        ...result,
        message: `Generated embeddings for ${result.processed} articles`,
      });
    }
  } catch (error) {
    logger.error("Failed to generate embeddings", { error });
    return apiError(
      "Failed to generate embeddings",
      error instanceof Error ? error.message : String(error),
      { status: 500 }
    );
  }
}

/**
 * DELETE - Clear all embeddings
 */
export async function DELETE() {
  try {
    logger.warn("Clearing all embeddings");

    const count = await clearAllEmbeddings();

    return apiResponse({
      cleared: count,
      message: `Cleared embeddings for ${count} articles`,
    });
  } catch (error) {
    logger.error("Failed to clear embeddings", { error });
    return apiError(
      "Failed to clear embeddings",
      error instanceof Error ? error.message : String(error),
      { status: 500 }
    );
  }
}


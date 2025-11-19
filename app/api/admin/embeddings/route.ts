/**
 * Embedding Management API
 * Admin endpoints for managing embeddings
 */

import { createHandler } from "@/lib/api-handler";
import { logger } from "@/lib/logger";
import { z } from "zod";
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
export const GET = createHandler(
  async () => {
    const stats = await getEmbeddingStats();
    const articlesWithoutEmbeddings = await getArticlesWithoutEmbeddings(10);

    return {
      stats,
      sampleArticlesWithoutEmbeddings: articlesWithoutEmbeddings.map((a) => ({
        id: a.id,
        title: a.title,
        feedId: a.feedId,
      })),
    };
  },
  { requireAuth: true }
);

const generateEmbeddingsSchema = z.object({
  articleIds: z.array(z.string()).optional(),
  limit: z.number().int().min(1).max(1000).optional().default(100),
});

/**
 * POST - Generate embeddings for articles
 * Uses logged-in user's LLM preferences if system key is not available
 */
export const POST = createHandler(
  async ({ body, session }) => {
    const { articleIds, limit } = body;
    const userId = session?.user?.id; // Get user ID from session

    if (articleIds && articleIds.length > 0) {
      // Generate for specific articles
      logger.info("Admin generating embeddings for specific articles", {
        count: articleIds.length,
        userId,
      });

      // Pass userId so it can use user's LLM preferences if system key fails
      const result = await generateBatchEmbeddings(
        articleIds,
        undefined,
        userId
      );

      return {
        ...result,
        message: `Generated embeddings for ${result.processed} articles${result.skipped > 0 ? `, skipped ${result.skipped} that already have embeddings` : ""}`,
      };
    } else {
      // Generate for articles without embeddings
      logger.info("Admin generating embeddings for articles without embeddings", {
        limit,
        userId,
      });

      const articles = await getArticlesWithoutEmbeddings(limit);
      
      if (articles.length === 0) {
        return {
          processed: 0,
          failed: 0,
          skipped: 0,
          totalTokens: 0,
          errors: [],
          message: "No articles without embeddings found",
        };
      }

      // Pass userId so it can use user's LLM preferences if system key fails
      const result = await generateBatchEmbeddings(
        articles.map((a) => a.id),
        undefined,
        userId
      );

      return {
        ...result,
        message: `Generated embeddings for ${result.processed} articles${result.skipped > 0 ? `, skipped ${result.skipped} that already have embeddings` : ""}`,
      };
    }
  },
  { bodySchema: generateEmbeddingsSchema, requireAuth: true }
);

/**
 * DELETE - Clear all embeddings
 */
export const DELETE = createHandler(
  async () => {
    logger.warn("Clearing all embeddings");

    const count = await clearAllEmbeddings();

    return {
      cleared: count,
      message: `Cleared embeddings for ${count} articles`,
    };
  },
  { requireAuth: true }
);


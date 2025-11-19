/**
 * User-specific embedding generation API
 * Allows users to generate embeddings using their own LLM preferences
 */

import { createHandler } from "@/lib/api-handler";
import { z } from "zod";
import {
  generateBatchEmbeddings,
  getArticlesWithoutEmbeddings,
} from "@/lib/services/article-embedding-service";
import { getEmbeddingStats } from "@/lib/services/article-service";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

const generateEmbeddingsSchema = z.object({
  articleIds: z.array(z.string()).optional(),
  limit: z.number().int().min(1).max(1000).optional().default(100),
});

/**
 * POST /api/user/articles/embeddings
 * Generate embeddings for articles using user's LLM preferences
 */
export const POST = createHandler(
  async ({ body, session }) => {
    const { articleIds, limit } = body;
    const userId = session!.user!.id;

    logger.info("User generating embeddings", { userId, articleIds, limit });

    try {
      let result;

      if (articleIds && articleIds.length > 0) {
        // Generate for specific articles
        result = await generateBatchEmbeddings(
          articleIds,
          undefined, // Use user's preferred provider
          userId // Use user's LLM preferences
        );

        logger.info("Generated embeddings for specific articles", {
          userId,
          count: result.processed,
          skipped: result.skipped,
          failed: result.failed,
        });
      } else {
        // Generate for articles without embeddings (up to limit)
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

        result = await generateBatchEmbeddings(
          articles.map((a) => a.id),
          undefined, // Use user's preferred provider
          userId // Use user's LLM preferences
        );

        logger.info("Generated embeddings for articles without embeddings", {
          userId,
          count: result.processed,
          skipped: result.skipped,
          failed: result.failed,
        });
      }

      return {
        ...result,
        message: `Generated embeddings for ${result.processed} articles${result.skipped > 0 ? `, skipped ${result.skipped} articles that already have embeddings` : ""}`,
      };
    } catch (error) {
      logger.error("Failed to generate embeddings for user", { userId, error });
      
      // Check if error is due to embeddings being disabled
      if (error instanceof Error && error.message === "Embeddings disabled for user") {
        throw new Error("Embeddings are disabled in your preferences. Please enable them in settings.");
      }
      
      throw error;
    }
  },
  { bodySchema: generateEmbeddingsSchema, requireAuth: true }
);

/**
 * GET /api/user/articles/embeddings
 * Get embedding statistics for the user
 */
export const GET = createHandler(
  async () => {
    const stats = await getEmbeddingStats();

    return {
      stats,
      message: "Embedding statistics retrieved successfully",
    };
  },
  { requireAuth: true }
);


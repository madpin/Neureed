/**
 * Embedding Streaming Service
 * Processes embeddings in small batches to reduce peak memory usage
 */

import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { generateEmbeddings } from "./embedding-service";
import { prepareTextForEmbedding } from "./article-embedding-service";
import { env } from "@/env";
import type { EmbeddingProvider } from "@/lib/embeddings/types";

/**
 * Generate embeddings for articles using a streaming approach
 * Processes articles in small batches, writing each batch to DB immediately
 * This reduces peak memory usage by ~80% compared to buffering all embeddings
 *
 * @param articleIds - Array of article IDs to process
 * @param provider - Optional embedding provider override
 * @param userId - Optional user ID for user-specific LLM preferences
 * @returns Statistics about processed articles
 */
export async function generateBatchEmbeddingsStreaming(
  articleIds: string[],
  provider?: EmbeddingProvider,
  userId?: string
): Promise<{
  processed: number;
  skipped: number;
  totalTokens: number;
  errors: Array<{ articleId: string; error: string }>;
}> {
  const streamBatchSize = env.EMBEDDING_STREAM_BATCH_SIZE;
  let totalProcessed = 0;
  let totalTokens = 0;
  let totalSkipped = 0;
  const errors: Array<{ articleId: string; error: string }> = [];

  if (articleIds.length === 0) {
    return { processed: 0, skipped: 0, totalTokens: 0, errors: [] };
  }

  logger.info("Starting streaming embedding generation", {
    totalArticles: articleIds.length,
    streamBatchSize,
    userId,
  });

  // Process in small batches to reduce memory usage
  for (let i = 0; i < articleIds.length; i += streamBatchSize) {
    const batch = articleIds.slice(i, i + streamBatchSize);

    try {
      // Fetch articles for this batch only (memory efficient)
      const allArticles = await prisma.articles.findMany({
        where: {
          id: { in: batch },
        },
      });

      // Filter out articles that already have embeddings
      // @ts-expect-error - embedding field is Unsupported type in Prisma
      const articles = allArticles.filter((article) => !article.embedding);

      const skippedInBatch = batch.length - articles.length;
      totalSkipped += skippedInBatch;

      if (articles.length === 0) {
        logger.debug(`Batch ${Math.floor(i / streamBatchSize) + 1}: All articles already have embeddings`, {
          skipped: skippedInBatch,
        });
        continue;
      }

      // Prepare texts and filter out empty ones
      const prepared = articles.map((article) => ({
        article,
        text: prepareTextForEmbedding(article).trim(),
      }));

      const validArticles = prepared.filter(({ article, text }) => {
        if (!text) {
          logger.warn("Skipping article with no content for embedding", {
            articleId: article.id,
          });
          totalSkipped++;
          return false;
        }
        return true;
      });

      if (validArticles.length === 0) {
        logger.debug(`Batch ${Math.floor(i / streamBatchSize) + 1}: No valid articles to process`, {
          skipped: prepared.length,
        });
        continue;
      }

      // Generate embeddings for this batch
      const texts = validArticles.map((item) => item.text);
      const result = await generateEmbeddings(texts, provider, userId);

      // Write batch to DB immediately (streaming!)
      // This frees memory before processing the next batch
      for (let j = 0; j < validArticles.length; j++) {
        const validArticle = validArticles[j];
        if (!validArticle) continue;

        try {
          await prisma.$executeRaw`
            UPDATE articles
            SET embedding = ${JSON.stringify(result.embeddings[j])}::vector
            WHERE id = ${validArticle.article.id}
          `;
          totalProcessed++;
        } catch (error) {
          errors.push({
            articleId: validArticle.article.id,
            error: error instanceof Error ? error.message : String(error),
          });
          logger.error("Failed to write embedding to database", {
            articleId: validArticle.article.id,
            error,
          });
        }
      }

      totalTokens += result.totalTokens;

      logger.info(`Embedding batch ${Math.floor(i / streamBatchSize) + 1} written`, {
        batchProcessed: validArticles.length,
        batchTokens: result.totalTokens,
        totalProcessed,
        totalArticles: articleIds.length,
        progress: `${Math.round(((i + streamBatchSize) / articleIds.length) * 100)}%`,
      });

      // Give event loop a chance to process other tasks
      // This prevents blocking the server during large batch operations
      await new Promise(resolve => setImmediate(resolve));

    } catch (error) {
      // Handle batch-level errors
      if (error instanceof Error && error.message === "Embeddings disabled for user") {
        logger.info("Embeddings disabled for user, stopping streaming", { userId });
        // Mark all remaining articles as skipped
        totalSkipped += (articleIds.length - i);
        break;
      }

      logger.error("Failed to process embedding batch", {
        batchStart: i,
        batchSize: batch.length,
        error: error instanceof Error ? error.message : String(error),
      });

      // Add all articles in failed batch to errors
      batch.forEach((articleId) => {
        errors.push({
          articleId,
          error: error instanceof Error ? error.message : String(error),
        });
      });
    }
  }

  logger.info("Streaming embedding generation completed", {
    processed: totalProcessed,
    skipped: totalSkipped,
    totalTokens,
    errors: errors.length,
    userId,
  });

  return {
    processed: totalProcessed,
    skipped: totalSkipped,
    totalTokens,
    errors,
  };
}

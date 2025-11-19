/**
 * Article Embedding Service
 * Handles embedding generation for articles
 */

import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { generateEmbedding, generateEmbeddings } from "./embedding-service";
import type { Article } from "@prisma/client";
import type { EmbeddingProvider } from "@/lib/embeddings/types";

/**
 * Prepare article text for embedding
 * Combines title, excerpt, and content (truncated)
 */
export function prepareTextForEmbedding(article: Article): string {
  const parts: string[] = [];

  // Add title (most important)
  if (article.title) {
    parts.push(article.title);
  }

  // Add excerpt if available
  if (article.excerpt) {
    parts.push(article.excerpt);
  }

  // Add content (truncated to ~2000 chars to stay within token limits)
  if (article.content) {
    const contentPreview = article.content.slice(0, 2000);
    parts.push(contentPreview);
  }

  return parts.join("\n\n");
}

/**
 * Generate embedding for a single article
 * If userId is provided, uses their LLM preferences and checks if they have embeddings enabled
 */
export async function generateArticleEmbedding(
  articleId: string,
  provider?: EmbeddingProvider,
  userId?: string
): Promise<{ success: boolean; tokens?: number; error?: string; skipped?: boolean }> {
  try {
    // Fetch article
    const article = await prisma.article.findUnique({
      where: { id: articleId },
    });

    if (!article) {
      return { success: false, error: "Article not found" };
    }

    // Check if article already has embeddings (don't recalculate)
    // @ts-expect-error - embedding field is Unsupported type in Prisma
    if (article.embedding) {
      logger.info("Article already has embedding, skipping", { articleId });
      return { success: true, skipped: true };
    }

    // Prepare text
    const text = prepareTextForEmbedding(article);

    // Generate embedding (this will check user preferences if userId is provided)
    const result = await generateEmbedding(text, provider, userId);

    // Update article with embedding
    await prisma.$executeRaw`
      UPDATE articles 
      SET embedding = ${JSON.stringify(result.embedding)}::vector
      WHERE id = ${articleId}
    `;

    logger.info("Generated article embedding", {
      articleId,
      tokens: result.tokens,
      userId,
    });

    return { success: true, tokens: result.tokens };
  } catch (error) {
    // Check if error is due to embeddings being disabled
    if (error instanceof Error && error.message === "Embeddings disabled for user") {
      logger.info("Embeddings disabled for user, skipping", { articleId, userId });
      return { success: false, error: "Embeddings disabled", skipped: true };
    }
    
    logger.error("Failed to generate article embedding", { articleId, userId, error });
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Generate embeddings for multiple articles in batch
 * If userId is provided, uses their LLM preferences and checks if they have embeddings enabled
 * Skips articles that already have embeddings
 */
export async function generateBatchEmbeddings(
  articleIds: string[],
  provider?: EmbeddingProvider,
  userId?: string
): Promise<{
  processed: number;
  failed: number;
  skipped: number;
  totalTokens: number;
  errors: Array<{ articleId: string; error: string }>;
}> {
  if (articleIds.length === 0) {
    return { processed: 0, failed: 0, skipped: 0, totalTokens: 0, errors: [] };
  }

  try {
    // Fetch articles (we can't filter by embedding in Prisma due to Unsupported type)
    const allArticles = await prisma.article.findMany({
      where: { 
        id: { in: articleIds },
      },
    });

    // Filter out articles that already have embeddings
    // @ts-expect-error - embedding field is Unsupported type in Prisma
    const articles = allArticles.filter((article) => !article.embedding);

    const skipped = articleIds.length - articles.length;
    if (skipped > 0) {
      logger.info("Skipping articles that already have embeddings", { skipped });
    }

    if (articles.length === 0) {
      return { processed: 0, failed: 0, skipped, totalTokens: 0, errors: [] };
    }

    // Prepare texts
    const texts = articles.map(prepareTextForEmbedding);

    // Generate embeddings (this will check user preferences if userId is provided)
    const result = await generateEmbeddings(texts, provider, userId);

    // Update articles with embeddings
    let processed = 0;
    let failed = 0;
    const errors: Array<{ articleId: string; error: string }> = [];

    for (let i = 0; i < articles.length; i++) {
      try {
        await prisma.$executeRaw`
          UPDATE articles 
          SET embedding = ${JSON.stringify(result.embeddings[i])}::vector
          WHERE id = ${articles[i].id}
        `;
        processed++;
      } catch (error) {
        failed++;
        errors.push({
          articleId: articles[i].id,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    logger.info("Generated batch article embeddings", {
      processed,
      failed,
      skipped,
      totalTokens: result.totalTokens,
      userId,
    });

    return {
      processed,
      failed,
      skipped,
      totalTokens: result.totalTokens,
      errors,
    };
  } catch (error) {
    // Check if error is due to embeddings being disabled
    if (error instanceof Error && error.message === "Embeddings disabled for user") {
      logger.info("Embeddings disabled for user, skipping batch", { userId });
      return {
        processed: 0,
        failed: 0,
        skipped: articleIds.length,
        totalTokens: 0,
        errors: [],
      };
    }
    
    logger.error("Failed to generate batch embeddings", {
      count: articleIds.length,
      userId,
      error,
    });
    return {
      processed: 0,
      failed: articleIds.length,
      skipped: 0,
      totalTokens: 0,
      errors: articleIds.map((id) => ({
        articleId: id,
        error: error instanceof Error ? error.message : String(error),
      })),
    };
  }
}

/**
 * Get articles without embeddings
 */
export async function getArticlesWithoutEmbeddings(
  limit: number = 100
): Promise<Article[]> {
  // Use raw SQL because embedding is Unsupported type in Prisma
  // Exclude embedding column to avoid deserialization error
  return prisma.$queryRaw<Article[]>`
    SELECT 
      id, "feedId", title, content, url, guid, author, excerpt, 
      "imageUrl", "contentHash", "publishedAt", "createdAt", "updatedAt"
    FROM articles
    WHERE embedding IS NULL
    ORDER BY "createdAt" DESC
    LIMIT ${limit}
  `;
}

/**
 * Count articles without embeddings
 */
export async function countArticlesWithoutEmbeddings(): Promise<number> {
  // Use raw SQL because embedding is Unsupported type in Prisma
  const result = await prisma.$queryRaw<Array<{ count: bigint }>>`
    SELECT COUNT(*) as count FROM articles
    WHERE embedding IS NULL
  `;
  return Number(result[0].count);
}

/**
 * Get embedding statistics
 */
export async function getEmbeddingStats(): Promise<{
  total: number;
  withEmbeddings: number;
  withoutEmbeddings: number;
  percentage: number;
}> {
  // Use raw SQL for counts involving embedding field
  // Use CASE to avoid deserializing the vector column
  const stats = await prisma.$queryRaw<Array<{
    total: bigint;
    with_embeddings: bigint;
    without_embeddings: bigint;
  }>>`
    SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN embedding IS NOT NULL THEN 1 ELSE 0 END) as with_embeddings,
      SUM(CASE WHEN embedding IS NULL THEN 1 ELSE 0 END) as without_embeddings
    FROM articles
  `;

  const total = Number(stats[0].total);
  const withEmbeddings = Number(stats[0].with_embeddings);
  const withoutEmbeddings = Number(stats[0].without_embeddings);
  const percentage = total > 0 ? (withEmbeddings / total) * 100 : 0;

  return {
    total,
    withEmbeddings,
    withoutEmbeddings,
    percentage: Math.round(percentage * 100) / 100,
  };
}

/**
 * Clear all embeddings (for re-generation)
 */
export async function clearAllEmbeddings(): Promise<number> {
  const result = await prisma.$executeRaw`
    UPDATE articles SET embedding = NULL WHERE embedding IS NOT NULL
  `;
  logger.info("Cleared all embeddings", { count: result });
  return result as number;
}

/**
 * Update article embedding if content changed
 */
export async function updateArticleEmbeddingIfNeeded(
  articleId: string,
  provider?: EmbeddingProvider
): Promise<{ updated: boolean; reason?: string }> {
  // Check if article has embedding using raw SQL
  const result = await prisma.$queryRaw<Array<{ has_embedding: boolean }>>`
    SELECT (embedding IS NOT NULL) as has_embedding
    FROM articles
    WHERE id = ${articleId}
  `;

  if (result.length === 0) {
    return { updated: false, reason: "Article not found" };
  }

  // If no embedding exists, generate one
  if (!result[0].has_embedding) {
    await generateArticleEmbedding(articleId, provider);
    return { updated: true, reason: "No embedding existed" };
  }

  // For now, we don't re-generate if embedding exists
  // In the future, we could check if content changed using contentHash
  return { updated: false, reason: "Embedding already exists" };
}


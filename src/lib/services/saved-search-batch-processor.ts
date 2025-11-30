/**
 * Saved Search Batch Processor
 *
 * Efficiently processes large batches of articles for matching
 * using parallelization and chunking strategies.
 */

import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';
import { matchArticle } from './saved-search-execution';
import { nanoid } from 'nanoid';

interface BatchProcessingOptions {
  batchSize?: number;
  maxConcurrent?: number;
  onProgress?: (processed: number, total: number) => void;
}

interface BatchResult {
  totalProcessed: number;
  totalMatches: number;
  duration: number;
  errors: number;
}

/**
 * Process articles in batches for better performance
 */
export async function processBatch<T, R>(
  items: T[],
  processor: (item: T) => Promise<R>,
  options: {
    batchSize?: number;
    maxConcurrent?: number;
  } = {}
): Promise<R[]> {
  const { batchSize = 100, maxConcurrent = 5 } = options;

  const results: R[] = [];
  const chunks: T[][] = [];

  // Split into chunks
  for (let i = 0; i < items.length; i += batchSize) {
    chunks.push(items.slice(i, i + batchSize));
  }

  // Process chunks with concurrency limit
  for (let i = 0; i < chunks.length; i += maxConcurrent) {
    const chunkBatch = chunks.slice(i, i + maxConcurrent);

    const chunkResults = await Promise.all(
      chunkBatch.map(async (chunk) => {
        const chunkResults = await Promise.all(
          chunk.map(async (item) => {
            try {
              return await processor(item);
            } catch (error) {
              logger.error('Batch processing error', {
                error: error instanceof Error ? error.message : String(error),
              });
              return null;
            }
          })
        );
        return chunkResults.filter((r): r is Awaited<R> => r !== null);
      })
    );

    results.push(...chunkResults.flat());
  }

  return results;
}

/**
 * Batch match articles to saved searches
 */
export async function batchMatchArticles(
  articleIds: string[],
  savedSearchIds: string[],
  options: BatchProcessingOptions = {}
): Promise<BatchResult> {
  const startTime = Date.now();
  const { batchSize = 50, maxConcurrent = 3, onProgress } = options;

  let totalMatches = 0;
  let errors = 0;

  try {
    // Fetch all searches with their settings
    const savedSearches = await prisma.saved_searches.findMany({
      where: {
        id: { in: savedSearchIds },
        archived: false,
      },
    });

    logger.info('Starting batch matching', {
      articleCount: articleIds.length,
      searchCount: savedSearches.length,
    });

    // Process articles in batches
    const chunks: string[][] = [];
    for (let i = 0; i < articleIds.length; i += batchSize) {
      chunks.push(articleIds.slice(i, i + batchSize));
    }

    let processed = 0;

    for (const chunk of chunks) {
      // Process chunk with concurrency limit
      const chunkPromises = savedSearches.map(async (search) => {
        const matches: Array<{
          id: string;
          savedSearchId: string;
          articleId: string;
          relevanceScore: number;
          matchedTerms: any;
          matchReason: string | null;
          createdAt: Date;
          notified: boolean;
        }> = [];

        for (const articleId of chunk) {
          try {
            const match = await matchArticle(
              articleId,
              search.query,
              search.threshold
            );

            if (match) {
              matches.push({
                id: nanoid(),
                savedSearchId: search.id,
                articleId: match.articleId,
                relevanceScore: match.relevanceScore,
                matchedTerms: match.matchedTerms as any,
                matchReason: match.matchReason,
                createdAt: new Date(),
                notified: false,
              });
            }
          } catch (error) {
            logger.error('Error matching article', {
              articleId,
              searchId: search.id,
              error: error instanceof Error ? error.message : String(error),
            });
            errors++;
          }
        }

        return matches;
      });

      // Wait for all searches to process this chunk
      const chunkResults = await Promise.all(chunkPromises);
      const allMatches = chunkResults.flat();

      // Bulk insert matches
      if (allMatches.length > 0) {
        try {
          await prisma.saved_search_matches.createMany({
            data: allMatches,
            skipDuplicates: true, // Avoid duplicate matches
          });

          totalMatches += allMatches.length;

          logger.debug('Inserted batch matches', {
            count: allMatches.length,
          });
        } catch (error) {
          logger.error('Failed to insert batch matches', {
            error: error instanceof Error ? error.message : String(error),
          });
          errors++;
        }
      }

      processed += chunk.length;
      onProgress?.(processed, articleIds.length);
    }

    // Update search statistics
    await updateSearchStatistics(savedSearchIds);

    const duration = Date.now() - startTime;

    logger.info('Batch matching completed', {
      totalProcessed: articleIds.length,
      totalMatches,
      duration,
      errors,
    });

    return {
      totalProcessed: articleIds.length,
      totalMatches,
      duration,
      errors,
    };
  } catch (error) {
    logger.error('Batch matching failed', {
      error: error instanceof Error ? error.message : String(error),
    });

    return {
      totalProcessed: 0,
      totalMatches: 0,
      duration: Date.now() - startTime,
      errors: errors + 1,
    };
  }
}

/**
 * Update statistics for multiple saved searches efficiently
 */
async function updateSearchStatistics(
  savedSearchIds: string[]
): Promise<void> {
  try {
    // Use a single query to update all searches
    const now = new Date();

    for (const searchId of savedSearchIds) {
      const matchCount = await prisma.saved_search_matches.count({
        where: { savedSearchId: searchId },
      });

      await prisma.saved_searches.update({
        where: { id: searchId },
        data: {
          totalMatches: matchCount,
          lastMatchedAt: now,
        },
      });
    }

    logger.debug('Updated search statistics', {
      count: savedSearchIds.length,
    });
  } catch (error) {
    logger.error('Failed to update search statistics', {
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * Parallel process function with rate limiting
 */
export async function parallelProcess<T, R>(
  items: T[],
  processor: (item: T) => Promise<R>,
  options: {
    concurrency?: number;
    rateLimitMs?: number;
  } = {}
): Promise<R[]> {
  const { concurrency = 5, rateLimitMs = 0 } = options;

  const results: R[] = [];
  const queue = [...items];
  const inProgress = new Set<Promise<void>>();

  while (queue.length > 0 || inProgress.size > 0) {
    // Fill up to concurrency limit
    while (queue.length > 0 && inProgress.size < concurrency) {
      const item = queue.shift()!;

      const promise = (async () => {
        try {
          const result = await processor(item);
          results.push(result);
        } catch (error) {
          logger.error('Parallel processing error', {
            error: error instanceof Error ? error.message : String(error),
          });
        }

        // Rate limiting
        if (rateLimitMs > 0) {
          await new Promise((resolve) => setTimeout(resolve, rateLimitMs));
        }
      })();

      inProgress.add(promise);
      promise.finally(() => inProgress.delete(promise));
    }

    // Wait for at least one to complete
    if (inProgress.size > 0) {
      await Promise.race(inProgress);
    }
  }

  return results;
}

/**
 * Progressive batch processor with checkpointing
 * Useful for very large batches that might fail partway through
 */
export class ProgressiveBatchProcessor {
  private checkpoints: Map<string, number> = new Map();

  async processWithCheckpoints<T>(
    items: T[],
    processor: (item: T, index: number) => Promise<void>,
    options: {
      batchSize?: number;
      checkpointKey: string;
      onCheckpoint?: (progress: number) => void;
    }
  ): Promise<void> {
    const { batchSize = 100, checkpointKey, onCheckpoint } = options;

    // Resume from checkpoint if exists
    const startIndex = this.checkpoints.get(checkpointKey) || 0;

    for (let i = startIndex; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);

      await Promise.all(
        batch.map((item, batchIndex) =>
          processor(item, i + batchIndex)
        )
      );

      // Update checkpoint
      const progress = Math.min(i + batchSize, items.length);
      this.checkpoints.set(checkpointKey, progress);
      onCheckpoint?.(progress);

      logger.debug('Checkpoint saved', {
        checkpointKey,
        progress,
        total: items.length,
      });
    }

    // Clear checkpoint on completion
    this.checkpoints.delete(checkpointKey);
  }

  getCheckpoint(key: string): number {
    return this.checkpoints.get(key) || 0;
  }

  clearCheckpoint(key: string): void {
    this.checkpoints.delete(key);
  }
}

/**
 * Deduplicate article IDs to avoid redundant processing
 */
export function deduplicateArticles(articleIds: string[]): string[] {
  return Array.from(new Set(articleIds));
}

/**
 * Prioritize articles by recency for matching
 */
export async function prioritizeArticles(
  articleIds: string[]
): Promise<string[]> {
  try {
    const articles = await prisma.articles.findMany({
      where: { id: { in: articleIds } },
      select: { id: true, publishedAt: true },
      orderBy: { publishedAt: 'desc' },
    });

    return articles.map((a) => a.id);
  } catch (error) {
    logger.error('Failed to prioritize articles', {
      error: error instanceof Error ? error.message : String(error),
    });
    return articleIds;
  }
}

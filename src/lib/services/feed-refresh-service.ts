import { parseFeedUrl } from "@/lib/feed-parser";
import {
  getFeed,
  updateFeedLastFetched,
  recordFeedError,
  clearFeedError,
  getFeedsToRefresh,
  getUserFeedsToRefresh,
} from "./feed-service";
import { upsertArticles } from "./article-service";
import { generateBatchEmbeddings } from "./article-embedding-service";
import { extractContent } from "./content-extraction-service";
import { shouldAutoGenerateEmbeddings } from "./admin-settings-service";
import { cleanupFeedArticles } from "./article-cleanup-service";
import { env } from "@/env";
import { logger } from "@/lib/logger";

/**
 * Result of a feed refresh operation
 */
export interface RefreshResult {
  feedId: string;
  success: boolean;
  newArticles: number;
  updatedArticles: number;
  error?: string;
  duration: number;
  embeddingsGenerated?: number;
  embeddingTokens?: number;
  extractionMethod?: string;
  extractionUsed?: boolean;
  cleanupResult?: {
    deleted: number;
    byAge: number;
    byCount: number;
  };
}

/**
 * Refresh a single feed
 * @param feedId - Feed ID to refresh
 * @param userId - Optional user ID for user-specific cleanup settings
 */
export async function refreshFeed(
  feedId: string,
  userId?: string
): Promise<RefreshResult> {
  const startTime = Date.now();

  try {
    // Get feed
    const feed = await getFeed(feedId);
    if (!feed) {
      return {
        feedId,
        success: false,
        newArticles: 0,
        updatedArticles: 0,
        error: "Feed not found",
        duration: Date.now() - startTime,
      };
    }

    // Check if feed has extraction settings
    const settings = (feed.settings as any)?.extraction;
    let extractionMethod: string | undefined;
    let extractionUsed = false;

    // Parse feed (always try RSS first)
    const parsedFeed = await parseFeedUrl(feed.url);

    // If feed has extraction settings and method is not RSS, try content extraction
    if (settings && settings.method !== "rss") {
      logger.info(`[FeedRefresh] Feed ${feedId} has extraction settings, attempting content extraction`);
      
      const mergeStrategy = settings.contentMergeStrategy || "replace";
      
      try {
        // Try to extract content for each article
        for (const article of parsedFeed.items) {
          if (article.link) {
            const extracted = await extractContent(article.link, feedId);
            
            if (extracted.success) {
              // Update article metadata
              article.title = extracted.title || article.title;
              article.excerpt = extracted.excerpt || article.excerpt;
              article.author = extracted.author || article.author;
              article.publishedAt = extracted.publishedAt || article.publishedAt;
              article.imageUrl = extracted.imageUrl || article.imageUrl;
              
              // Merge content based on strategy
              const rssContent = article.content || "";
              const extractedContent = extracted.content || "";
              
              switch (mergeStrategy) {
                case "prepend":
                  article.content = extractedContent + "\n\n" + rssContent;
                  break;
                case "append":
                  article.content = rssContent + "\n\n" + extractedContent;
                  break;
                case "replace":
                default:
                  article.content = extractedContent;
                  break;
              }
              
              extractionMethod = extracted.method;
              extractionUsed = true;
              
              logger.info(`[FeedRefresh] Successfully extracted content for article: ${article.title} (strategy: ${mergeStrategy})`);
            } else {
              logger.warn(`[FeedRefresh] Content extraction failed for ${article.link}, using RSS content: ${extracted.error}`);
            }
          }
        }
      } catch (error) {
        logger.error(`[FeedRefresh] Content extraction error: ${error}`);
        // Continue with RSS content on error
      }
    }

    // Log article content before upserting (for debugging)
    if (extractionUsed && parsedFeed.items.length > 0) {
      const firstArticle = parsedFeed.items[0];
      logger.info(`[FeedRefresh] First article before upsert - Title: ${firstArticle.title}, Content length: ${firstArticle.content?.length || 0}`);
    }

    // Upsert articles
    const result = await upsertArticles(feedId, parsedFeed.items);
    
    logger.info(`[FeedRefresh] Upsert result: created=${result.created}, updated=${result.updated}, skipped=${result.skipped}`);

    // Generate embeddings for new articles if enabled
    let embeddingsGenerated = 0;
    let embeddingTokens = 0;

    const autoGenerateEmbeddings = await shouldAutoGenerateEmbeddings();
    if (autoGenerateEmbeddings && result.articleIds.length > 0) {
      try {
        const embeddingResult = await generateBatchEmbeddings(
          result.articleIds
        );
        embeddingsGenerated = embeddingResult.processed;
        embeddingTokens = embeddingResult.totalTokens;

        logger.info("Generated embeddings for new articles", {
          feedId,
          count: embeddingsGenerated,
          tokens: embeddingTokens,
        });
      } catch (error) {
        logger.error("Failed to generate embeddings for new articles", {
          feedId,
          error,
        });
        // Don't fail the refresh if embedding generation fails
      }
    }

    // Update feed metadata
    await updateFeedLastFetched(feedId);

    // Clear any previous errors
    if (feed.errorCount > 0) {
      await clearFeedError(feedId);
    }

    // Cleanup old articles after refresh
    let cleanupResult: { deleted: number; byAge: number; byCount: number } | undefined;
    try {
      const cleanup = await cleanupFeedArticles(feedId, userId);
      cleanupResult = {
        deleted: cleanup.deleted,
        byAge: cleanup.details.byAge,
        byCount: cleanup.details.byCount,
      };
      
      if (cleanup.deleted > 0) {
        logger.info("Cleaned up articles after feed refresh", {
          feedId,
          deleted: cleanup.deleted,
          byAge: cleanup.details.byAge,
          byCount: cleanup.details.byCount,
        });
      }
    } catch (cleanupError) {
      logger.error("Failed to cleanup articles after feed refresh", {
        feedId,
        error: cleanupError,
      });
      // Don't fail the refresh if cleanup fails
    }

    return {
      feedId,
      success: true,
      newArticles: result.created,
      updatedArticles: result.updated,
      duration: Date.now() - startTime,
      embeddingsGenerated,
      embeddingTokens,
      extractionMethod,
      extractionUsed,
      cleanupResult,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    // Record error
    await recordFeedError(feedId, errorMessage);

    return {
      feedId,
      success: false,
      newArticles: 0,
      updatedArticles: 0,
      error: errorMessage,
      duration: Date.now() - startTime,
    };
  }
}

/**
 * Refresh multiple feeds in parallel
 * @param feedIds - Array of feed IDs to refresh
 * @param userId - Optional user ID for user-specific cleanup settings
 * @param maxConcurrent - Maximum number of concurrent refreshes
 */
export async function refreshFeeds(
  feedIds: string[],
  userId?: string,
  maxConcurrent = 5
): Promise<RefreshResult[]> {
  const results: RefreshResult[] = [];

  // Process feeds in batches
  for (let i = 0; i < feedIds.length; i += maxConcurrent) {
    const batch = feedIds.slice(i, i + maxConcurrent);
    const batchResults = await Promise.all(
      batch.map((feedId) => refreshFeed(feedId, userId))
    );
    results.push(...batchResults);
  }

  return results;
}

/**
 * Refresh all feeds that are due for refresh (system-wide)
 */
export async function refreshAllDueFeeds(): Promise<{
  total: number;
  successful: number;
  failed: number;
  results: RefreshResult[];
}> {
  // Get feeds that need refreshing
  const feeds = await getFeedsToRefresh();

  if (feeds.length === 0) {
    return {
      total: 0,
      successful: 0,
      failed: 0,
      results: [],
    };
  }

  // Refresh feeds (no userId, uses system defaults for cleanup)
  const results = await refreshFeeds(feeds.map((f) => f.id));

  // Calculate stats
  const successful = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;

  return {
    total: results.length,
    successful,
    failed,
    results,
  };
}

/**
 * Refresh all feeds that are due for refresh for a specific user
 * Uses user's configured refresh intervals and cleanup settings
 */
export async function refreshUserFeeds(userId: string): Promise<{
  total: number;
  successful: number;
  failed: number;
  results: RefreshResult[];
}> {
  // Get user's feeds that need refreshing
  const feedsToRefresh = await getUserFeedsToRefresh(userId);

  if (feedsToRefresh.length === 0) {
    return {
      total: 0,
      successful: 0,
      failed: 0,
      results: [],
    };
  }

  logger.info("Refreshing user feeds", {
    userId,
    feedCount: feedsToRefresh.length,
  });

  // Refresh feeds with user-specific settings
  const results = await refreshFeeds(
    feedsToRefresh.map((f) => f.feed.id),
    userId
  );

  // Calculate stats
  const successful = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;

  return {
    total: results.length,
    successful,
    failed,
    results,
  };
}

/**
 * Get refresh statistics
 */
export function getRefreshStats(results: RefreshResult[]): {
  totalFeeds: number;
  successful: number;
  failed: number;
  totalNewArticles: number;
  totalUpdatedArticles: number;
  averageDuration: number;
  errors: Array<{ feedId: string; error: string }>;
} {
  const successful = results.filter((r) => r.success);
  const failed = results.filter((r) => !r.success);

  const totalNewArticles = successful.reduce(
    (sum, r) => sum + r.newArticles,
    0
  );
  const totalUpdatedArticles = successful.reduce(
    (sum, r) => sum + r.updatedArticles,
    0
  );
  const averageDuration =
    results.reduce((sum, r) => sum + r.duration, 0) / results.length;

  const errors = failed
    .filter((r) => r.error)
    .map((r) => ({
      feedId: r.feedId,
      error: r.error!,
    }));

  return {
    totalFeeds: results.length,
    successful: successful.length,
    failed: failed.length,
    totalNewArticles,
    totalUpdatedArticles,
    averageDuration: Math.round(averageDuration),
    errors,
  };
}


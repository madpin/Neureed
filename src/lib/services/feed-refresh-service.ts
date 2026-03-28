import { parseFeedUrl } from "@/lib/feed-parser";
import {
  getFeed,
  updateFeedLastFetched,
  recordFeedError,
  clearFeedError,
  getFeedsToRefresh,
  getUserFeedsToRefresh,
} from "./feed-service";
import { upsertArticles, updateArticle } from "./article-service";
import { generateBatchEmbeddings } from "./article-embedding-service";
import { extractContent } from "./content-extraction-service";
import { shouldAutoGenerateEmbeddings } from "./admin-settings-service";
import { cleanupFeedArticles } from "./article-cleanup-service";
import { extractionRateLimiter } from "./extraction-rate-limiter";
import { env } from "@/env";
import { ArticleExtractionStatus } from "@/generated/prisma/enums";
import { logger } from "@/lib/logger";
import { sanitizeExtractionErrorMessage } from "@/lib/services/extraction-error-utils";

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
  summarizationResult?: {
    summarized: number;
    failed: number;
    skipped: number;
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
    // TODO: Pass etag/lastModified from feed record for conditional requests
    const parsedFeed = await parseFeedUrl(feed.url);
    
    // Handle 304 Not Modified - feed hasn't changed
    if (!parsedFeed) {
      logger.info(`[FeedRefresh] Feed ${feedId} returned 304 Not Modified, skipping`);
      return {
        feedId,
        success: true,
        newArticles: 0,
        updatedArticles: 0,
        duration: Date.now() - startTime,
      };
    }

    // If feed has extraction settings and method is not RSS, try content extraction
    // Only extract content for NEW articles to avoid wasting resources
    // 
    // IMPORTANT OPTIMIZATION: We check for duplicates BEFORE extracting content
    // because extraction (Readability/Playwright) is CPU and network intensive.
    // Most RSS feeds contain articles already in our database, so checking first
    // prevents wasting resources and reduces risk of rate limiting/IP blocking.
    // 
    // See: docs/guides/development/content-extraction-optimization.md
    if (settings && settings.method !== "rss") {
      logger.info(`[FeedRefresh] Feed ${feedId} has extraction settings, checking for new articles`);
      
      const mergeStrategy = settings.contentMergeStrategy || "replace";
      
      try {
        // Import deduplication functions
        const { findDuplicateArticle } = await import("./article-deduplication");
        
        // Try to extract content for each article
        for (const article of parsedFeed.items) {
          if (article.link) {
            // Check if article already exists BEFORE extracting content
            const existing = await findDuplicateArticle(article, feedId);

            if (existing) {
              logger.info(`[FeedRefresh] Article already exists, skipping extraction: ${article.title}`);
              continue;
            }

            // Only extract content for NEW articles
            logger.info(`[FeedRefresh] New article detected, extracting content: ${article.title}`);

            // RATE LIMITING: Wait for rate limit slot before extracting
            await extractionRateLimiter.waitForSlot(article.link, feedId);

            let extractionSuccess = false;
            let extractionError: string | undefined;
            let extractionHttpStatus: number | undefined;

            try {
              const extracted = await extractContent(article.link, feedId);
              extractionSuccess = extracted.success;
              extractionError = extracted.error;

              // Try to extract HTTP status from error if available
              if (!extractionSuccess && extracted.error) {
                const statusMatch = extracted.error.match(/status[:\s]+(\d{3})/i);
                if (statusMatch && statusMatch[1]) {
                  extractionHttpStatus = parseInt(statusMatch[1]);
                }
              }

              if (extractionSuccess) {
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
                article.extractionStatus = ArticleExtractionStatus.SUCCESS;
                article.extractionError = null;

                logger.info(`[FeedRefresh] Successfully extracted content for article: ${article.title} (strategy: ${mergeStrategy})`);
              } else {
                article.extractionStatus = ArticleExtractionStatus.FAILED;
                article.extractionError = sanitizeExtractionErrorMessage(extractionError);
                logger.warn(`[FeedRefresh] Content extraction failed for ${article.link}, using RSS content: ${extractionError}`);
              }
            } catch (error) {
              extractionSuccess = false;
              extractionError = error instanceof Error ? error.message : String(error);
              article.extractionStatus = ArticleExtractionStatus.FAILED;
              article.extractionError = sanitizeExtractionErrorMessage(extractionError);
              logger.error(`[FeedRefresh] Exception during content extraction: ${extractionError}`);
            } finally {
              // RATE LIMITING: Record extraction attempt (success or failure)
              await extractionRateLimiter.recordExtraction(
                article.link,
                extractionSuccess,
                extractionError,
                extractionHttpStatus
              );
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
      if (firstArticle) {
        logger.info(`[FeedRefresh] First article before upsert - Title: ${firstArticle.title}, Content length: ${firstArticle.content?.length || 0}`);
      }
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
        // Pass userId if available so user's LLM preferences are used
        const embeddingResult = await generateBatchEmbeddings(
          result.articleIds,
          undefined, // Use default provider
          userId // Use user's LLM preferences if available
        );
        embeddingsGenerated = embeddingResult.processed;
        embeddingTokens = embeddingResult.totalTokens;

        logger.info("Generated embeddings for new articles", {
          feedId,
          userId,
          count: embeddingsGenerated,
          skipped: embeddingResult.skipped,
          tokens: embeddingTokens,
        });
      } catch (error) {
        logger.error("Failed to generate embeddings for new articles", {
          feedId,
          userId,
          error,
        });
        // Don't fail the refresh if embedding generation fails
      }
    }

    // Generate summaries for new articles if enabled (async, non-blocking)
    // Note: Starts in background but we don't wait for completion to avoid blocking refresh
    if (result.articleIds.length > 0 && userId) {
      // Import dynamically to avoid circular dependencies
      import("./article-summarization-service")
        .then(({ processFeedArticleSummaries }) => {
          // Run asynchronously without blocking the feed refresh
          processFeedArticleSummaries(feedId, userId, {
            articleIds: result.articleIds,
          })
            .then((summResult) => {
              logger.info("Completed async summarization for feed", {
                feedId,
                userId,
                summarized: summResult.summarized,
                failed: summResult.failed,
                skipped: summResult.skipped,
              });

              // Create a follow-up notification if summaries were generated
              if (summResult.summarized > 0 || summResult.failed > 0) {
                import("./notification-service")
                  .then(({ createNotification }) => {
                    const parts = [];
                    if (summResult.summarized > 0) {
                      parts.push(
                        `${summResult.summarized} article${summResult.summarized > 1 ? "s" : ""} summarized`
                      );
                    }
                    if (summResult.failed > 0) {
                      parts.push(`${summResult.failed} failed`);
                    }
                    if (summResult.skipped > 0) {
                      parts.push(`${summResult.skipped} skipped`);
                    }

                    return createNotification({
                      userId,
                      type: "info",
                      title: "Article Summarization Complete",
                      message: parts.join(", "),
                      metadata: {
                        ...summResult,
                      },
                    });
                  })
                  .catch((error) => {
                    logger.error("Failed to create summarization notification", {
                      error,
                      feedId,
                      userId,
                    });
                  });
              }
            })
            .catch((error) => {
              logger.error("Failed async summarization for feed", {
                feedId,
                userId,
                error,
              });

              // Notify user of failure
              import("./notification-service")
                .then(({ createNotification }) => {
                  return createNotification({
                    userId,
                    type: "warning",
                    title: "Article Summarization Failed",
                    message: "Some articles could not be summarized",
                    metadata: {
                      feedId,
                      error: error instanceof Error ? error.message : String(error),
                    },
                  });
                })
                .catch((notifError) => {
                  logger.error("Failed to create error notification", {
                    error: notifError,
                  });
                });
            });
        })
        .catch((error) => {
          logger.error("Failed to import article-summarization-service", {
            error,
          });
        });
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
      // Note: summarizationResult is handled via separate notification
      // since summarization runs asynchronously in the background
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
 * @param maxConcurrent - Maximum number of concurrent refreshes (defaults to env.FEED_REFRESH_CONCURRENCY)
 */
export async function refreshFeeds(
  feedIds: string[],
  userId?: string,
  maxConcurrent?: number
): Promise<RefreshResult[]> {
  const concurrency = maxConcurrent ?? env.FEED_REFRESH_CONCURRENCY;
  const results: RefreshResult[] = [];

  // Process feeds in batches
  for (let i = 0; i < feedIds.length; i += concurrency) {
    const batch = feedIds.slice(i, i + concurrency);
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
    feedsToRefresh.map((f) => f.feeds.id),
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

/**
 * Result of refreshing specific articles
 */
export interface RefreshArticlesResult {
  feedId: string;
  success: boolean;
  articlesProcessed: number;
  articlesUpdated: number;
  articlesFailed: number;
  embeddingsGenerated: number;
  embeddingTokens: number;
  error?: string;
  duration: number;
}

/**
 * Refresh the last X articles for a feed
 * Re-extracts content using the current extraction settings
 * Useful when changing extraction methods
 *
 * @param feedId - Feed ID
 * @param count - Number of articles to refresh (max 50)
 * @param userId - Optional user ID for user-specific settings
 */
export async function refreshLastArticles(
  feedId: string,
  count: number = 10,
  userId?: string
): Promise<RefreshArticlesResult> {
  const startTime = Date.now();

  // Limit to 50 articles
  const articleCount = Math.min(Math.max(1, count), 50);

  try {
    // Get feed and check extraction settings
    const feed = await getFeed(feedId);
    if (!feed) {
      return {
        feedId,
        success: false,
        articlesProcessed: 0,
        articlesUpdated: 0,
        articlesFailed: 0,
        embeddingsGenerated: 0,
        embeddingTokens: 0,
        error: "Feed not found",
        duration: Date.now() - startTime,
      };
    }

    const settings = (feed.settings as any)?.extraction;
    if (!settings || settings.method === "rss") {
      return {
        feedId,
        success: false,
        articlesProcessed: 0,
        articlesUpdated: 0,
        articlesFailed: 0,
        embeddingsGenerated: 0,
        embeddingTokens: 0,
        error: "Feed does not have extraction settings or uses RSS only",
        duration: Date.now() - startTime,
      };
    }

    logger.info(`[RefreshLastArticles] Starting refresh of last ${articleCount} articles for feed ${feedId}`);

    // Get the last X articles for this feed
    const { prisma } = await import("@/lib/db");
    const articles = await prisma.articles.findMany({
      where: { feedId },
      orderBy: { publishedAt: "desc" },
      take: articleCount,
    });

    if (articles.length === 0) {
      return {
        feedId,
        success: true,
        articlesProcessed: 0,
        articlesUpdated: 0,
        articlesFailed: 0,
        embeddingsGenerated: 0,
        embeddingTokens: 0,
        duration: Date.now() - startTime,
      };
    }

    logger.info(`[RefreshLastArticles] Found ${articles.length} articles to refresh`);

    let articlesUpdated = 0;
    let articlesFailed = 0;
    const updatedArticleIds: string[] = [];
    const mergeStrategy = settings.contentMergeStrategy || "replace";

    // Process each article
    for (const article of articles) {
      let extractionSuccess = false;
      let extractionError: string | undefined;
      let extractionHttpStatus: number | undefined;

      try {
        if (!article.url) {
          logger.warn(`[RefreshLastArticles] Article ${article.id} has no URL, skipping`);
          articlesFailed++;
          continue;
        }

        // RATE LIMITING: Wait for rate limit slot before extracting
        await extractionRateLimiter.waitForSlot(article.url, feedId);

        // Extract content
        const extracted = await extractContent(article.url, feedId);
        extractionSuccess = extracted.success;
        extractionError = extracted.error;

        if (!extractionSuccess && extracted.error) {
          const statusMatch = extracted.error.match(/status[:\s]+(\d{3})/i);
          if (statusMatch?.[1]) {
            extractionHttpStatus = parseInt(statusMatch[1], 10);
          }
        }

        if (!extractionSuccess) {
          logger.warn(`[RefreshLastArticles] Failed to extract content for article ${article.id}: ${extractionError}`);
          articlesFailed++;

          await updateArticle(article.id, {
            extractionStatus: ArticleExtractionStatus.FAILED,
            extractionError: sanitizeExtractionErrorMessage(extractionError),
          });

          // Record failed extraction
          await extractionRateLimiter.recordExtraction(
            article.url,
            false,
            extractionError,
            extractionHttpStatus
          );
          continue;
        }

        // Prepare update data
        const updateData: Parameters<typeof updateArticle>[1] = {};
        let hasChanges = false;

        // Update metadata if available
        if (extracted.title && extracted.title !== article.title) {
          updateData.title = extracted.title;
          hasChanges = true;
        }
        if (extracted.excerpt && extracted.excerpt !== article.excerpt) {
          updateData.excerpt = extracted.excerpt;
          hasChanges = true;
        }
        if (extracted.author && extracted.author !== article.author) {
          updateData.author = extracted.author;
          hasChanges = true;
        }
        if (extracted.imageUrl && extracted.imageUrl !== article.imageUrl) {
          updateData.imageUrl = extracted.imageUrl;
          hasChanges = true;
        }
        if (extracted.publishedAt) {
          const newDate = new Date(extracted.publishedAt);
          const existingDate = article.publishedAt ? new Date(article.publishedAt) : null;
          if (!existingDate || newDate.getTime() !== existingDate.getTime()) {
            updateData.publishedAt = newDate;
            hasChanges = true;
          }
        }

        // Handle content based on merge strategy
        const extractedContent = extracted.content || "";
        let newContent = "";

        switch (mergeStrategy) {
          case "prepend":
            newContent = extractedContent + "\n\n" + (article.content || "");
            break;
          case "append":
            newContent = (article.content || "") + "\n\n" + extractedContent;
            break;
          case "replace":
          default:
            newContent = extractedContent;
            break;
        }

        // Check if content actually changed
        if (newContent !== article.content) {
          updateData.content = newContent;
          hasChanges = true;
        }

        updateData.extractionStatus = ArticleExtractionStatus.SUCCESS;
        updateData.extractionError = null;

        const extractionMetaChanged =
          article.extractionStatus !== ArticleExtractionStatus.SUCCESS;

        // Persist body changes and/or extraction outcome (e.g. clear prior FAILED)
        if (hasChanges || extractionMetaChanged) {
          await updateArticle(article.id, updateData);

          updatedArticleIds.push(article.id);
          articlesUpdated++;

          logger.info(`[RefreshLastArticles] Updated article ${article.id}: ${article.title} (strategy: ${mergeStrategy})`);
        } else {
          logger.info(`[RefreshLastArticles] No changes for article ${article.id}, skipping update`);
        }

        // Record successful extraction
        await extractionRateLimiter.recordExtraction(
          article.url,
          true
        );

      } catch (error) {
        extractionError = error instanceof Error ? error.message : String(error);
        logger.error(`[RefreshLastArticles] Error processing article ${article.id}: ${extractionError}`);
        articlesFailed++;

        try {
          await updateArticle(article.id, {
            extractionStatus: ArticleExtractionStatus.FAILED,
            extractionError: sanitizeExtractionErrorMessage(extractionError),
          });
        } catch (persistErr) {
          logger.error(`[RefreshLastArticles] Failed to persist extraction error for ${article.id}: ${persistErr}`);
        }

        // Record failed extraction
        if (article.url) {
          await extractionRateLimiter.recordExtraction(
            article.url,
            false,
            extractionError
          );
        }
      }
    }

    // Generate embeddings for updated articles if enabled
    let embeddingsGenerated = 0;
    let embeddingTokens = 0;

    const autoGenerateEmbeddings = await shouldAutoGenerateEmbeddings();
    if (autoGenerateEmbeddings && updatedArticleIds.length > 0) {
      try {
        logger.info(`[RefreshLastArticles] Generating embeddings for ${updatedArticleIds.length} updated articles`);

        const embeddingResult = await generateBatchEmbeddings(
          updatedArticleIds,
          undefined,
          userId
        );
        embeddingsGenerated = embeddingResult.processed;
        embeddingTokens = embeddingResult.totalTokens;

        logger.info(`[RefreshLastArticles] Generated ${embeddingsGenerated} embeddings`);
      } catch (error) {
        logger.error(`[RefreshLastArticles] Failed to generate embeddings: ${error}`);
        // Don't fail the operation if embedding generation fails
      }
    }

    logger.info(`[RefreshLastArticles] Completed: ${articlesUpdated} updated, ${articlesFailed} failed`);

    return {
      feedId,
      success: true,
      articlesProcessed: articles.length,
      articlesUpdated,
      articlesFailed,
      embeddingsGenerated,
      embeddingTokens,
      duration: Date.now() - startTime,
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    logger.error(`[RefreshLastArticles] Error: ${errorMessage}`);

    return {
      feedId,
      success: false,
      articlesProcessed: 0,
      articlesUpdated: 0,
      articlesFailed: 0,
      embeddingsGenerated: 0,
      embeddingTokens: 0,
      error: errorMessage,
      duration: Date.now() - startTime,
    };
  }
}


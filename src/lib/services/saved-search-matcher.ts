/**
 * Saved Search Matcher Service
 *
 * Matches new articles against all active saved searches.
 * Creates SavedSearchMatch records and triggers notifications.
 */

import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { nanoid } from "nanoid";
import { matchArticle } from "./saved-search-execution";
import { createNotification } from "./notification-service";
import { generateEmbedding } from "./embedding-service";
import type { EmbeddingProvider } from "@/lib/embeddings/types";

export interface MatchStats {
  totalArticles: number;
  totalSearches: number;
  totalMatches: number;
  notificationsSent: number;
  duration: number;
}

/**
 * Match new articles against all active saved searches
 *
 * @param articleIds - Array of article IDs to match
 * @param userId - Optional user ID to match only for specific user
 * @param provider - Optional embedding provider
 */
export async function matchNewArticles(
  articleIds: string[],
  userId?: string,
  provider?: EmbeddingProvider
): Promise<MatchStats> {
  const startTime = Date.now();

  try {
    logger.info("Starting saved search matching", {
      articleCount: articleIds.length,
      userId,
    });

    // Fetch all active saved searches
    const savedSearches = await prisma.saved_searches.findMany({
      where: {
        archived: false,
        ...(userId && { userId }),
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            user_preferences: {
              select: {
                llmProvider: true,
                llmBaseUrl: true,
                llmApiKey: true,
              },
            },
          },
        },
      },
    });

    if (savedSearches.length === 0) {
      logger.info("No active saved searches found");
      return {
        totalArticles: articleIds.length,
        totalSearches: 0,
        totalMatches: 0,
        notificationsSent: 0,
        duration: Date.now() - startTime,
      };
    }

    // PRE-COMPUTE QUERY EMBEDDINGS (once per search, not per article!)
    logger.info("Pre-computing query embeddings", {
      searchCount: savedSearches.length,
    });

    const queryEmbeddings = new Map<string, number[]>();

    for (const search of savedSearches) {
      try {
        const userProvider = search.user.user_preferences?.llmProvider as EmbeddingProvider | undefined;
        const finalProvider = userProvider || provider;

        // Generate embedding once per search
        const embeddingResult = await generateEmbedding(search.query, finalProvider);
        queryEmbeddings.set(search.id, embeddingResult.embedding);

        logger.debug("Pre-computed query embedding", {
          searchId: search.id,
          searchName: search.name,
          query: search.query,
          dimensions: embeddingResult.embedding.length,
        });
      } catch (error) {
        logger.error("Failed to generate query embedding", {
          searchId: search.id,
          searchName: search.name,
          query: search.query,
          error: error instanceof Error ? error.message : String(error),
        });
        // Continue without semantic matching for this search (will use keyword matching only)
      }
    }

    logger.info("Query embeddings pre-computed", {
      total: savedSearches.length,
      successful: queryEmbeddings.size,
      failed: savedSearches.length - queryEmbeddings.size,
    });

    let totalMatches = 0;
    let notificationsSent = 0;

    // Batch process articles (100 at a time to avoid overwhelming the system)
    const batchSize = 100;
    for (let i = 0; i < articleIds.length; i += batchSize) {
      const batch = articleIds.slice(i, i + batchSize);

      // Match each article against all saved searches
      for (const articleId of batch) {
        for (const search of savedSearches) {
          try {
            // Use user's LLM preferences if available
            const userProvider = search.user.user_preferences?.llmProvider as EmbeddingProvider | undefined;
            const queryEmbedding = queryEmbeddings.get(search.id);

            // Match article against saved search with pre-computed embedding
            const matchResult = await matchArticle(
              articleId,
              search.query,
              search.threshold,
              userProvider || provider,
              queryEmbedding  // Pass pre-computed embedding
            );

            if (matchResult) {
              // Create or update match record
              const existingMatch = await prisma.saved_search_matches.findUnique({
                where: {
                  savedSearchId_articleId: {
                    savedSearchId: search.id,
                    articleId: articleId,
                  },
                },
              });

              if (!existingMatch) {
                // Create new match
                await prisma.saved_search_matches.create({
                  data: {
                    id: nanoid(),
                    savedSearchId: search.id,
                    articleId: articleId,
                    relevanceScore: matchResult.relevanceScore,
                    matchedTerms: matchResult.matchedTerms,
                    matchReason: matchResult.matchReason,
                    notified: false,
                  },
                });

                totalMatches++;

                // Update saved search stats
                await prisma.saved_searches.update({
                  where: { id: search.id },
                  data: {
                    totalMatches: { increment: 1 },
                    lastMatchedAt: new Date(),
                  },
                });

                // Send notification if enabled and threshold met
                if (
                  search.notifyOnMatch &&
                  matchResult.relevanceScore >= search.notifyThreshold
                ) {
                  // Fetch article details for notification
                  const articleDetails = await prisma.articles.findUnique({
                    where: { id: articleId },
                    select: {
                      id: true,
                      title: true,
                      feedId: true,
                    },
                  });

                  if (articleDetails) {
                    await createNotification({
                      userId: search.userId,
                      type: "info",
                      title: `New match for "${search.name}"`,
                      message: articleDetails.title,
                      metadata: {
                        savedSearchId: search.id,
                        articleId: articleId,
                        relevanceScore: matchResult.relevanceScore,
                        matchedTerms: matchResult.matchedTerms,
                        matchReason: matchResult.matchReason,
                      },
                    });

                    notificationsSent++;

                    // Mark match as notified
                    await prisma.saved_search_matches.updateMany({
                      where: {
                        savedSearchId: search.id,
                        articleId: articleId,
                      },
                      data: {
                        notified: true,
                      },
                    });
                  }
                }
              }
            }
          } catch (error) {
            logger.error("Failed to match article against saved search", {
              error: error instanceof Error ? error.message : String(error),
              articleId: articleId,
              savedSearchId: search.id,
            });
            // Continue with next search
          }
        }
      }
    }

    const duration = Date.now() - startTime;

    logger.info("Saved search matching completed", {
      totalArticles: articleIds.length,
      totalSearches: savedSearches.length,
      totalMatches,
      notificationsSent,
      duration: `${duration}ms`,
    });

    return {
      totalArticles: articleIds.length,
      totalSearches: savedSearches.length,
      totalMatches,
      notificationsSent,
      duration,
    };
  } catch (error) {
    logger.error("Saved search matching failed", {
      error: error instanceof Error ? error.message : String(error),
      articleCount: articleIds.length,
      userId,
    });
    throw error;
  }
}

/**
 * Rematch all articles for a specific saved search
 * Useful when a saved search is updated
 *
 * @param savedSearchId - The saved search ID to rematch
 * @param provider - Optional embedding provider
 * @returns Number of new matches found
 */
export async function rematchSavedSearch(
  savedSearchId: string,
  provider?: EmbeddingProvider
): Promise<number> {
  const startTime = Date.now();

  try {
    logger.info("Starting saved search rematch", { savedSearchId });

    // Fetch the saved search
    const savedSearch = await prisma.saved_searches.findUnique({
      where: { id: savedSearchId },
      include: {
        user: {
          select: {
            id: true,
            user_preferences: {
              select: {
                llmProvider: true,
              },
            },
          },
        },
      },
    });

    if (!savedSearch) {
      throw new Error(`Saved search not found: ${savedSearchId}`);
    }

    // Get user's LLM provider preference
    const userProvider = savedSearch.user.user_preferences?.llmProvider as EmbeddingProvider | undefined;
    const finalProvider = userProvider || provider;

    // Fetch all articles (limit to recent articles for performance)
    const articles = await prisma.articles.findMany({
      where: {
        // Only rematch articles from the last 90 days
        publishedAt: {
          gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
        },
        // Optionally filter by priority sources
        ...(savedSearch.prioritySources &&
          Array.isArray(savedSearch.prioritySources) &&
          (savedSearch.prioritySources as string[]).length > 0 && {
            feedId: { in: savedSearch.prioritySources as string[] },
          }),
      },
      select: { id: true },
      orderBy: { publishedAt: 'desc' },
    });

    logger.info("Rematching articles", {
      savedSearchId,
      searchName: savedSearch.name,
      query: savedSearch.query,
      articleCount: articles.length,
    });

    // Delete existing matches (we'll recreate them)
    const deletedMatches = await prisma.saved_search_matches.deleteMany({
      where: { savedSearchId },
    });

    logger.info("Deleted existing matches", {
      savedSearchId,
      deletedCount: deletedMatches.count,
    });

    // Reset stats
    await prisma.saved_searches.update({
      where: { id: savedSearchId },
      data: {
        totalMatches: 0,
        lastMatchedAt: null,
      },
    });

    // PRE-COMPUTE QUERY EMBEDDING ONCE
    let queryEmbedding: number[] | undefined;
    try {
      const embeddingResult = await generateEmbedding(savedSearch.query, finalProvider);
      queryEmbedding = embeddingResult.embedding;

      logger.info("Pre-computed query embedding for rematch", {
        savedSearchId,
        query: savedSearch.query,
        dimensions: embeddingResult.embedding.length,
      });
    } catch (error) {
      logger.error("Failed to generate query embedding for rematch", {
        savedSearchId,
        query: savedSearch.query,
        error: error instanceof Error ? error.message : String(error),
      });
      // Continue without semantic matching (will use keyword matching only)
    }

    // Match articles with pre-computed embedding
    let totalMatches = 0;
    const batchSize = 100;

    for (let i = 0; i < articles.length; i += batchSize) {
      const batch = articles.slice(i, i + batchSize);

      for (const article of batch) {
        try {
          const matchResult = await matchArticle(
            article.id,
            savedSearch.query,
            savedSearch.threshold,
            finalProvider,
            queryEmbedding  // Pass pre-computed embedding
          );

          if (matchResult) {
            // Create new match
            await prisma.saved_search_matches.create({
              data: {
                id: nanoid(),
                savedSearchId: savedSearch.id,
                articleId: article.id,
                relevanceScore: matchResult.relevanceScore,
                matchedTerms: matchResult.matchedTerms,
                matchReason: matchResult.matchReason,
                notified: false,
              },
            });

            totalMatches++;
          }
        } catch (error) {
          logger.error("Failed to match article during rematch", {
            error: error instanceof Error ? error.message : String(error),
            articleId: article.id,
            savedSearchId: savedSearch.id,
          });
          // Continue with next article
        }
      }
    }

    // Update saved search stats
    await prisma.saved_searches.update({
      where: { id: savedSearchId },
      data: {
        totalMatches: totalMatches,
        lastMatchedAt: totalMatches > 0 ? new Date() : null,
      },
    });

    const duration = Date.now() - startTime;

    logger.info("Saved search rematch completed", {
      savedSearchId,
      searchName: savedSearch.name,
      articlesProcessed: articles.length,
      newMatches: totalMatches,
      duration: `${duration}ms`,
    });

    return totalMatches;
  } catch (error) {
    logger.error("Saved search rematch failed", {
      error: error instanceof Error ? error.message : String(error),
      savedSearchId,
    });
    throw error;
  }
}

/**
 * Clean up old matches for a saved search
 * Removes matches older than a specified number of days
 *
 * @param savedSearchId - The saved search ID
 * @param daysToKeep - Number of days to keep matches (default: 90)
 */
export async function cleanupOldMatches(
  savedSearchId: string,
  daysToKeep: number = 90
): Promise<number> {
  try {
    const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);

    const result = await prisma.saved_search_matches.deleteMany({
      where: {
        savedSearchId,
        createdAt: {
          lt: cutoffDate,
        },
      },
    });

    logger.info("Cleaned up old matches", {
      savedSearchId,
      deletedCount: result.count,
      daysToKeep,
    });

    // Update total matches count
    const remainingMatches = await prisma.saved_search_matches.count({
      where: { savedSearchId },
    });

    await prisma.saved_searches.update({
      where: { id: savedSearchId },
      data: { totalMatches: remainingMatches },
    });

    return result.count;
  } catch (error) {
    logger.error("Failed to cleanup old matches", {
      error: error instanceof Error ? error.message : String(error),
      savedSearchId,
    });
    throw error;
  }
}

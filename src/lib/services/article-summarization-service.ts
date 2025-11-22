/**
 * Article Summarization Service
 * Handles automatic article summarization during feed refresh
 */

import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { shouldAutoGenerateSummaries } from "./admin-settings-service";
import { getEffectiveFeedSettings } from "./feed-settings-cascade";

/**
 * Result of feed article summarization processing
 */
export interface FeedSummarizationResult {
  feedId: string;
  totalArticles: number;
  summarized: number;
  skipped: number;
  failed: number;
  errors: string[];
}

/**
 * Process articles for a feed that need summarization
 * This function filters articles based on settings and delegates to batch processing
 */
export async function processFeedArticleSummaries(
  feedId: string,
  userId: string,
  options?: {
    articleIds?: string[]; // Optional: Only process specific articles
    forceRegenerate?: boolean; // Optional: Regenerate existing summaries
  }
): Promise<FeedSummarizationResult> {
  const result: FeedSummarizationResult = {
    feedId,
    totalArticles: 0,
    summarized: 0,
    skipped: 0,
    failed: 0,
    errors: [],
  };

  try {
    // Check if admin has enabled auto-summarization system-wide
    const autoGenerateEnabled = await shouldAutoGenerateSummaries();
    if (!autoGenerateEnabled) {
      logger.debug("Summarization disabled system-wide", { feedId });
      return result;
    }

    // Get feed-specific settings with cascade
    const feedSettings = await getEffectiveFeedSettings(userId, feedId);

    // Check if summarization is enabled for this feed
    if (!feedSettings.summarization.enabled) {
      logger.debug("Summarization disabled for feed", { feedId, userId });
      return result;
    }

    // Build query for articles that need summarization
    const whereClause: any = {
      feedId,
    };

    // If specific article IDs provided, filter to those
    if (options?.articleIds && options.articleIds.length > 0) {
      whereClause.id = { in: options.articleIds };
    }

    // If not forcing regeneration, only get articles without summaries
    if (!options?.forceRegenerate) {
      whereClause.summary = null;
    }

    // Get articles that might need summarization
    const articles = await prisma.articles.findMany({
      where: whereClause,
      select: {
        id: true,
        title: true,
        content: true,
        summary: true,
        keyPoints: true,
        topics: true,
      },
    });

    result.totalArticles = articles.length;

    if (articles.length === 0) {
      logger.debug("No articles need summarization", { feedId });
      return result;
    }

    // Filter articles based on content length threshold
    const minContentLength = feedSettings.summarization.minContentLength;
    const articlesToSummarize = articles.filter((article) => {
      const contentLength = article.content?.length || 0;
      return contentLength >= minContentLength;
    });

    result.skipped = articles.length - articlesToSummarize.length;

    logger.info("Processing articles for summarization", {
      feedId,
      totalArticles: result.totalArticles,
      toSummarize: articlesToSummarize.length,
      skipped: result.skipped,
      minContentLength,
    });

    // Process articles (import the batch function dynamically to avoid circular deps)
    const { batchSummarizeArticlesWithTracking } = await import(
      "./summarization-service"
    );

    const summarizationResult = await batchSummarizeArticlesWithTracking(
      articlesToSummarize.map((a) => a.id),
      {
        userId,
        includeKeyPoints: feedSettings.summarization.includeKeyPoints,
        includeTopics: feedSettings.summarization.includeTopics,
      }
    );

    result.summarized = summarizationResult.success;
    result.failed = summarizationResult.failed;
    result.errors = summarizationResult.errors;

    logger.info("Feed article summarization completed", {
      ...result,
    });

    return result;
  } catch (error) {
    logger.error("Failed to process feed article summaries", {
      feedId,
      error,
    });
    result.errors.push(
      error instanceof Error ? error.message : "Unknown error"
    );
    return result;
  }
}

/**
 * Process articles for multiple feeds asynchronously
 * This is called during feed refresh to avoid blocking
 */
export async function processMultipleFeedSummaries(
  feedIds: string[],
  userId: string
): Promise<Map<string, FeedSummarizationResult>> {
  const results = new Map<string, FeedSummarizationResult>();

  // Process feeds in parallel
  await Promise.all(
    feedIds.map(async (feedId) => {
      const result = await processFeedArticleSummaries(feedId, userId);
      results.set(feedId, result);
    })
  );

  return results;
}

/**
 * Get articles that need summarization for a user
 * Useful for manual triggers or displaying pending work
 */
export async function getArticlesNeedingSummarization(
  userId: string,
  options?: {
    feedId?: string;
    limit?: number;
  }
): Promise<{
  articles: Array<{
    id: string;
    title: string;
    feedId: string;
    feedTitle: string;
    contentLength: number;
    publishedAt: Date | null;
  }>;
  totalCount: number;
}> {
  try {
    // Check if admin has enabled auto-summarization
    const autoGenerateEnabled = await shouldAutoGenerateSummaries();
    if (!autoGenerateEnabled) {
      return { articles: [], totalCount: 0 };
    }

    // Get user's feeds with summarization enabled
    const userFeeds = await prisma.user_feeds.findMany({
      where: {
        userId,
        ...(options?.feedId ? { feedId: options.feedId } : {}),
      },
      include: {
        feeds: true,
      },
    });

    // Filter feeds that have summarization enabled
    const eligibleFeeds: string[] = [];
    for (const userFeed of userFeeds) {
      const settings = await getEffectiveFeedSettings(userId, userFeed.feedId);
      if (settings.summarization.enabled) {
        eligibleFeeds.push(userFeed.feedId);
      }
    }

    if (eligibleFeeds.length === 0) {
      return { articles: [], totalCount: 0 };
    }

    // Get articles without summaries from eligible feeds
    const articles = await prisma.articles.findMany({
      where: {
        feedId: { in: eligibleFeeds },
        summary: null,
      },
      select: {
        id: true,
        title: true,
        feedId: true,
        content: true,
        publishedAt: true,
        feeds: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        publishedAt: "desc",
      },
      take: options?.limit || 100,
    });

    // Filter by content length based on feed settings
    const articlesWithLength = await Promise.all(
      articles.map(async (article) => {
        const settings = await getEffectiveFeedSettings(userId, article.feedId);
        const contentLength = article.content?.length || 0;

        return {
          id: article.id,
          title: article.title,
          feedId: article.feedId,
          feedTitle: article.feeds.name,
          contentLength,
          publishedAt: article.publishedAt,
          meetsThreshold: contentLength >= settings.summarization.minContentLength,
        };
      })
    );

    const filteredArticles = articlesWithLength.filter((a) => a.meetsThreshold);

    return {
      articles: filteredArticles.map((a) => ({
        id: a.id,
        title: a.title,
        feedId: a.feedId,
        feedTitle: a.feedTitle,
        contentLength: a.contentLength,
        publishedAt: a.publishedAt,
      })),
      totalCount: filteredArticles.length,
    };
  } catch (error) {
    logger.error("Failed to get articles needing summarization", {
      userId,
      error,
    });
    return { articles: [], totalCount: 0 };
  }
}

/**
 * Estimate summarization costs for pending articles
 */
export async function estimateSummarizationCosts(
  userId: string,
  feedId?: string
): Promise<{
  articleCount: number;
  estimatedTokens: number;
  estimatedCost: number;
}> {
  const { articles } = await getArticlesNeedingSummarization(userId, { feedId });

  const { estimateSummarizationCost } = await import(
    "./summarization-cost-tracker"
  );

  let totalEstimatedTokens = 0;
  let totalEstimatedCost = 0;

  for (const article of articles) {
    const estimate = estimateSummarizationCost({
      textLength: article.contentLength,
      provider: "openai", // Default to OpenAI for estimation
      model: "gpt-3.5-turbo",
    });

    totalEstimatedTokens += estimate.estimatedTotalTokens;
    totalEstimatedCost += estimate.estimatedCost;
  }

  return {
    articleCount: articles.length,
    estimatedTokens: totalEstimatedTokens,
    estimatedCost: totalEstimatedCost,
  };
}

import { prisma } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";
import { getEffectiveFeedSettings } from "./feed-settings-cascade";
import { logger } from "@/lib/logger";

/**
 * Cleanup options
 */
export interface CleanupOptions {
  maxAge?: number; // days
  maxArticlesPerFeed?: number;
  preserveStarred?: boolean;
  dryRun?: boolean;
}

/**
 * Cleanup result
 */
export interface CleanupResult {
  deleted: number;
  preserved: number;
  dryRun: boolean;
  details: {
    byAge: number;
    byCount: number;
  };
}

/**
 * Clean up old articles based on age
 */
export async function cleanupOldArticles(
  options: CleanupOptions = {}
): Promise<CleanupResult> {
  const {
    maxAge = 90, // 90 days default
    maxArticlesPerFeed = 1000,
    preserveStarred = true,
    dryRun = false,
  } = options;

  let totalDeleted = 0;
  const totalPreserved = 0;
  let deletedByAge = 0;
  let deletedByCount = 0;

  // Calculate cutoff date
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - maxAge);

  // Delete old articles
  const oldArticlesWhere: Prisma.articlesWhereInput = {
    createdAt: {
      lt: cutoffDate,
    },
  };

  if (dryRun) {
    // Just count
    deletedByAge = await prisma.articles.count({
      where: oldArticlesWhere,
    });
  } else {
    // Actually delete
    const result = await prisma.articles.deleteMany({
      where: oldArticlesWhere,
    });
    deletedByAge = result.count;
  }

  totalDeleted += deletedByAge;

  // Clean up by count per feed
  const feeds = await prisma.feeds.findMany({
    select: { id: true },
  });

  for (const feed of feeds) {
    const articleCount = await prisma.articles.count({
      where: { feedId: feed.id },
    });

    if (articleCount > maxArticlesPerFeed) {
      const toDelete = articleCount - maxArticlesPerFeed;

      // Get oldest articles to delete
      const oldestArticles = await prisma.articles.findMany({
        where: { feedId: feed.id },
        orderBy: { createdAt: "asc" },
        take: toDelete,
        select: { id: true },
      });

      if (!dryRun) {
        await prisma.articles.deleteMany({
          where: {
            id: {
              in: oldestArticles.map((a) => a.id),
            },
          },
        });
      }

      deletedByCount += oldestArticles.length;
      totalDeleted += oldestArticles.length;
    }
  }

  return {
    deleted: totalDeleted,
    preserved: totalPreserved,
    dryRun,
    details: {
      byAge: deletedByAge,
      byCount: deletedByCount,
    },
  };
}

/**
 * Delete articles older than specified days
 */
export async function deleteArticlesOlderThan(days: number): Promise<number> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  const result = await prisma.articles.deleteMany({
    where: {
      createdAt: {
        lt: cutoffDate,
      },
    },
  });

  return result.count;
}

/**
 * Delete oldest articles from a feed, keeping only the most recent N
 */
export async function keepOnlyRecentArticles(
  feedId: string,
  keepCount: number
): Promise<number> {
  // Get total count
  const totalCount = await prisma.articles.count({
    where: { feedId },
  });

  if (totalCount <= keepCount) {
    return 0; // Nothing to delete
  }

  // Get articles to keep (most recent)
  const articlesToKeep = await prisma.articles.findMany({
    where: { feedId },
    orderBy: { createdAt: "desc" },
    take: keepCount,
    select: { id: true },
  });

  const keepIds = articlesToKeep.map((a) => a.id);

  // Delete articles not in keep list
  const result = await prisma.articles.deleteMany({
    where: {
      feedId,
      id: {
        notIn: keepIds,
      },
    },
  });

  return result.count;
}

/**
 * Clean up articles for a specific feed using user-specific settings
 * If userId is provided, uses cascading settings (feed → category → user → system)
 * If no userId, uses system defaults
 */
export async function cleanupFeedArticles(
  feedId: string,
  userId?: string
): Promise<CleanupResult> {
  let maxAge = 90; // System default
  let maxArticlesPerFeed = 500; // System default

  // Get user-specific settings if userId provided
  if (userId) {
    try {
      const settings = await getEffectiveFeedSettings(userId, feedId);
      maxAge = settings.maxArticleAge;
      maxArticlesPerFeed = settings.maxArticlesPerFeed;

      logger.debug("Using user-specific cleanup settings", {
        userId,
        feedId,
        maxAge,
        maxArticlesPerFeed,
        source: settings.source,
      });
    } catch (error) {
      logger.error("Failed to get user settings, using system defaults", {
        userId,
        feedId,
        error,
      });
      // Fall back to system defaults (already set above)
    }
  }

  let deletedByAge = 0;
  let deletedByCount = 0;

  // Calculate cutoff date
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - maxAge);

  // Delete old articles by age
  const oldArticlesResult = await prisma.articles.deleteMany({
    where: {
      feedId,
      createdAt: {
        lt: cutoffDate,
      },
    },
  });
  deletedByAge = oldArticlesResult.count;

  // Clean up by count (keep only most recent N articles)
  const articleCount = await prisma.articles.count({
    where: { feedId },
  });

  if (articleCount > maxArticlesPerFeed) {
    const toDelete = articleCount - maxArticlesPerFeed;

    // Get oldest articles to delete
    const oldestArticles = await prisma.articles.findMany({
      where: { feedId },
      orderBy: { createdAt: "asc" },
      take: toDelete,
      select: { id: true },
    });

    if (oldestArticles.length > 0) {
      await prisma.articles.deleteMany({
        where: {
          id: {
            in: oldestArticles.map((a) => a.id),
          },
        },
      });
      deletedByCount = oldestArticles.length;
    }
  }

  const totalDeleted = deletedByAge + deletedByCount;

  return {
    deleted: totalDeleted,
    preserved: 0,
    dryRun: false,
    details: {
      byAge: deletedByAge,
      byCount: deletedByCount,
    },
  };
}

/**
 * Get cleanup statistics
 */
export async function getCleanupStats(): Promise<{
  totalArticles: number;
  articlesOlderThan30Days: number;
  articlesOlderThan90Days: number;
  articlesOlderThan180Days: number;
  feedsOverLimit: number;
}> {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
  const oneEightyDaysAgo = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);

  const [
    totalArticles,
    articlesOlderThan30Days,
    articlesOlderThan90Days,
    articlesOlderThan180Days,
  ] = await Promise.all([
    prisma.articles.count(),
    prisma.articles.count({
      where: { createdAt: { lt: thirtyDaysAgo } },
    }),
    prisma.articles.count({
      where: { createdAt: { lt: ninetyDaysAgo } },
    }),
    prisma.articles.count({
      where: { createdAt: { lt: oneEightyDaysAgo } },
    }),
  ]);

  // Count feeds with more than 1000 articles
  const feeds = await prisma.feeds.findMany({
    include: {
      _count: {
        select: { articles: true },
      },
    },
  });

  const feedsOverLimit = feeds.filter((f) => f._count.articles > 1000).length;

  return {
    totalArticles,
    articlesOlderThan30Days,
    articlesOlderThan90Days,
    articlesOlderThan180Days,
    feedsOverLimit,
  };
}

/**
 * Vacuum database (PostgreSQL specific)
 * Reclaims storage after large deletions
 */
export async function vacuumDatabase(): Promise<void> {
  try {
    await prisma.$executeRawUnsafe("VACUUM ANALYZE articles");
    console.log("Database vacuum completed");
  } catch (error) {
    console.error("Error vacuuming database:", error);
  }
}


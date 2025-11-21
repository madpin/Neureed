import { refreshAllDueFeeds, refreshUserFeeds, getRefreshStats, refreshFeeds } from "../services/feed-refresh-service";
import { getUserFeedsToRefresh } from "../services/feed-service";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { createJobExecutor, type JobResult } from "./job-executor";
import { createScheduledJob } from "./job-scheduler";
import { JobLogger } from "./job-logger";
import { createFeedRefreshNotification, cleanupOldNotifications } from "../services/notification-service";

/**
 * Cron job for refreshing feeds
 */

// Create job executor with concurrency control
const executeJob = createJobExecutor("feed-refresh");

// Create scheduler
const scheduler = createScheduledJob(
  "Feed Refresh",
  executeFeedRefreshJob,
  "*/30 * * * *"
);

/**
 * Core feed refresh logic (multi-user aware)
 * Refreshes feeds based on user subscriptions and their configured intervals
 */
async function runFeedRefresh(): Promise<JobResult> {
  const now = new Date();
  const jobLogger = new JobLogger();
  
  jobLogger.info("Starting multi-user feed refresh");
  logger.info("Starting multi-user feed refresh");

  // Get all user-feed subscriptions with their settings in one query
  // This is much more efficient than querying each user individually
  const userFeeds = await prisma.user_feeds.findMany({
    include: {
      feeds: true,
      user_feed_categories: {
        include: {
          user_categories: true,
        },
      },
      users: {
        include: {
          user_preferences: true,
        },
      },
    },
  });

  if (userFeeds.length === 0) {
    jobLogger.info("No user feed subscriptions found, skipping feed refresh");
    logger.info("No user feed subscriptions found, skipping feed refresh");
    return {
      success: true,
      stats: {
        totalFeeds: 0,
        successful: 0,
        failed: 0,
        newArticles: 0,
        updatedArticles: 0,
        articlesCleanedUp: 0,
        errors: [],
      },
      logs: jobLogger.getLogs(),
    };
  }

  // Collect feeds that need refreshing
  const feedRefreshMap = new Map<string, Set<string>>(); // feedId -> Set of userIds

  for (const userFeed of userFeeds) {
    const feed = userFeed.feeds;
    
    // Skip feeds with too many errors
    if (feed.errorCount >= 10) {
      continue;
    }

    // Determine effective refresh interval using cascade logic
    const defaultRefreshInterval = userFeed.users.user_preferences?.defaultRefreshInterval || 60;
    let refreshInterval = defaultRefreshInterval;

    // Check category settings (if feed is in a category)
    if (userFeed.user_feed_categories.length > 0) {
      const categorySettings = userFeed.user_feed_categories[0].user_categories.settings as any;
      if (categorySettings?.refreshInterval !== undefined && categorySettings?.refreshInterval !== null) {
        refreshInterval = categorySettings.refreshInterval;
      }
    }

    // Check feed-specific settings (highest priority)
    const feedSettings = userFeed.settings as any;
    if (feedSettings?.refreshInterval !== undefined && feedSettings?.refreshInterval !== null) {
      refreshInterval = feedSettings.refreshInterval;
    }

    // Check if feed needs refresh
    const lastFetched = feed.lastFetched;
    const refreshIntervalMs = refreshInterval * 60 * 1000;

    if (!lastFetched || now.getTime() - lastFetched.getTime() >= refreshIntervalMs) {
      if (!feedRefreshMap.has(feed.id)) {
        feedRefreshMap.set(feed.id, new Set());
      }
      feedRefreshMap.get(feed.id)!.add(userFeed.userId);
    }
  }

  const feedIds = Array.from(feedRefreshMap.keys());
  
  if (feedIds.length === 0) {
    jobLogger.info("No feeds need refreshing at this time");
    logger.info("No feeds need refreshing at this time");
    return {
      success: true,
      stats: {
        totalFeeds: 0,
        successful: 0,
        failed: 0,
        newArticles: 0,
        updatedArticles: 0,
        articlesCleanedUp: 0,
        errors: [],
      },
      logs: jobLogger.getLogs(),
    };
  }

  const userCount = new Set(userFeeds.map(uf => uf.userId)).size;
  
  jobLogger.info(`Refreshing ${feedIds.length} unique feed(s) for ${userCount} user(s)`, {
    feedCount: feedIds.length,
    userCount,
  });
  logger.info(`Refreshing ${feedIds.length} unique feed(s) for ${userCount} user(s)`, {
    feedCount: feedIds.length,
    userCount,
  });

  // Refresh feeds (no specific userId for cleanup - use system defaults)
  // Individual users' cleanup will happen on their personal schedule
  jobLogger.info("Starting feed refresh process");
  
  // Get feed details for better logging
  const feedDetails = await prisma.feeds.findMany({
    where: { id: { in: feedIds } },
    select: { id: true, name: true, url: true },
  });
  
  const feedMap = new Map(feedDetails.map(f => [f.id, f]));
  
  const results = await refreshFeeds(feedIds);
  const stats = getRefreshStats(results);

  // Log detailed results for each feed
  for (const result of results) {
    const feed = feedMap.get(result.feedId);
    const feedName = feed?.name || feed?.url || result.feedId;
    
    if (result.success) {
      const details: any = {
        feedId: result.feedId,
        feedName,
        newArticles: result.newArticles,
        updatedArticles: result.updatedArticles,
        duration: `${(result.duration / 1000).toFixed(2)}s`,
      };
      
      if (result.embeddingsGenerated) {
        details.embeddingsGenerated = result.embeddingsGenerated;
        details.embeddingTokens = result.embeddingTokens;
      }
      
      if (result.extractionUsed) {
        details.extractionMethod = result.extractionMethod;
      }
      
      if (result.cleanupResult && result.cleanupResult.deleted > 0) {
        details.articlesCleanedUp = result.cleanupResult.deleted;
        details.cleanupDetails = {
          byAge: result.cleanupResult.byAge,
          byCount: result.cleanupResult.byCount,
        };
      }
      
      const totalArticles = result.newArticles + result.updatedArticles;
      if (totalArticles > 0) {
        jobLogger.info(`✓ ${feedName}: +${result.newArticles} new, ~${result.updatedArticles} updated`, details);
        logger.info(`Feed refreshed: ${feedName}`, details);
      } else {
        jobLogger.info(`✓ ${feedName}: No new articles`, details);
        logger.info(`Feed refreshed (no changes): ${feedName}`, details);
      }
    } else {
      jobLogger.error(`✗ ${feedName}: ${result.error}`, {
        feedId: result.feedId,
        feedName,
        error: result.error,
        duration: `${(result.duration / 1000).toFixed(2)}s`,
      });
      logger.error(`Feed refresh failed: ${feedName}`, {
        feedId: result.feedId,
        error: result.error,
      });
    }
  }

  // Calculate cleanup stats
  const totalCleaned = results.reduce(
    (sum, r) => sum + (r.cleanupResult?.deleted || 0),
    0
  );
  
  const totalEmbeddings = results.reduce(
    (sum, r) => sum + (r.embeddingsGenerated || 0),
    0
  );
  
  const totalTokens = results.reduce(
    (sum, r) => sum + (r.embeddingTokens || 0),
    0
  );

  if (stats.errors.length > 0) {
    jobLogger.error("Feed refresh errors", { errorCount: stats.errors.length });
    logger.error("Feed refresh errors", { errors: stats.errors });
  }

  const summaryDetails: any = {
    totalFeeds: stats.totalFeeds,
    successful: stats.successful,
    failed: stats.failed,
    newArticles: stats.totalNewArticles,
    updatedArticles: stats.totalUpdatedArticles,
    articlesCleanedUp: totalCleaned,
    averageDuration: `${(stats.averageDuration / 1000).toFixed(2)}s`,
  };
  
  if (totalEmbeddings > 0) {
    summaryDetails.embeddingsGenerated = totalEmbeddings;
    summaryDetails.totalTokens = totalTokens;
  }
  
  jobLogger.info("Feed refresh completed", summaryDetails);
  logger.info("Feed refresh completed", summaryDetails);

  // Create notifications for all affected users
  const affectedUserIds = Array.from(new Set(userFeeds.map(uf => uf.userId)));
  jobLogger.info(`Creating notifications for ${affectedUserIds.length} user(s)`);
  
  for (const userId of affectedUserIds) {
    try {
      const notification = await createFeedRefreshNotification(userId, {
        totalFeeds: stats.totalFeeds,
        successful: stats.successful,
        failed: stats.failed,
        newArticles: stats.totalNewArticles,
        updatedArticles: stats.totalUpdatedArticles,
        articlesCleanedUp: totalCleaned,
        embeddingsGenerated: totalEmbeddings > 0 ? totalEmbeddings : undefined,
        totalTokens: totalTokens > 0 ? totalTokens : undefined,
        duration: `${(stats.averageDuration / 1000).toFixed(2)}s`,
      });
      
      if (notification) {
        jobLogger.info(`Notification created for user ${userId}`);
      }
      
      // Cleanup old notifications (keep last 100)
      await cleanupOldNotifications(userId);
    } catch (error) {
      logger.error(`Failed to create notification for user ${userId}`, { error });
      // Don't fail the job if notification fails
    }
  }

  return {
    success: true,
    stats: {
      totalFeeds: stats.totalFeeds,
      successful: stats.successful,
      failed: stats.failed,
      newArticles: stats.totalNewArticles,
      updatedArticles: stats.totalUpdatedArticles,
      articlesCleanedUp: totalCleaned,
      errors: stats.errors.slice(0, 5),
    },
    logs: jobLogger.getLogs(),
  };
}

/**
 * Execute feed refresh job (system-wide)
 * Note: Cleanup runs automatically after each feed refresh
 */
export async function executeFeedRefreshJob(): Promise<void> {
  await executeJob(runFeedRefresh, "SCHEDULER");
}

/**
 * Execute feed refresh job for a specific user
 */
export async function executeUserFeedRefreshJob(userId: string): Promise<void> {
  await executeJob(async () => {
    const jobLogger = new JobLogger();
    
    jobLogger.info(`Starting feed refresh for user ${userId}`);
    logger.info(`Starting user feed refresh`, { userId });
    
    const result = await refreshUserFeeds(userId);
    const stats = getRefreshStats(result.results);
    
    // Get feed details for better logging
    const feedIds = result.results.map(r => r.feedId);
    const feedDetails = await prisma.feeds.findMany({
      where: { id: { in: feedIds } },
      select: { id: true, name: true, url: true },
    });
    
    const feedMap = new Map(feedDetails.map(f => [f.id, f]));
    
    // Log detailed results for each feed
    for (const feedResult of result.results) {
      const feed = feedMap.get(feedResult.feedId);
      const feedName = feed?.name || feed?.url || feedResult.feedId;
      
      if (feedResult.success) {
        const details: any = {
          feedId: feedResult.feedId,
          feedName,
          newArticles: feedResult.newArticles,
          updatedArticles: feedResult.updatedArticles,
          duration: `${(feedResult.duration / 1000).toFixed(2)}s`,
        };
        
        if (feedResult.embeddingsGenerated) {
          details.embeddingsGenerated = feedResult.embeddingsGenerated;
          details.embeddingTokens = feedResult.embeddingTokens;
        }
        
        if (feedResult.extractionUsed) {
          details.extractionMethod = feedResult.extractionMethod;
        }
        
        if (feedResult.cleanupResult && feedResult.cleanupResult.deleted > 0) {
          details.articlesCleanedUp = feedResult.cleanupResult.deleted;
          details.cleanupDetails = {
            byAge: feedResult.cleanupResult.byAge,
            byCount: feedResult.cleanupResult.byCount,
          };
        }
        
        const totalArticles = feedResult.newArticles + feedResult.updatedArticles;
        if (totalArticles > 0) {
          jobLogger.info(`✓ ${feedName}: +${feedResult.newArticles} new, ~${feedResult.updatedArticles} updated`, details);
        } else {
          jobLogger.info(`✓ ${feedName}: No new articles`, details);
        }
      } else {
        jobLogger.error(`✗ ${feedName}: ${feedResult.error}`, {
          feedId: feedResult.feedId,
          feedName,
          error: feedResult.error,
          duration: `${(feedResult.duration / 1000).toFixed(2)}s`,
        });
      }
    }

    const totalCleaned = result.results.reduce(
      (sum, r) => sum + (r.cleanupResult?.deleted || 0),
      0
    );
    
    const totalEmbeddings = result.results.reduce(
      (sum, r) => sum + (r.embeddingsGenerated || 0),
      0
    );
    
    const totalTokens = result.results.reduce(
      (sum, r) => sum + (r.embeddingTokens || 0),
      0
    );

    if (stats.errors.length > 0) {
      jobLogger.error("User feed refresh errors", { userId, errorCount: stats.errors.length });
      logger.error("User feed refresh errors", { userId, errors: stats.errors });
    }
    
    const summaryDetails: any = {
      userId,
      totalFeeds: stats.totalFeeds,
      successful: stats.successful,
      failed: stats.failed,
      newArticles: stats.totalNewArticles,
      updatedArticles: stats.totalUpdatedArticles,
      articlesCleanedUp: totalCleaned,
      averageDuration: `${(stats.averageDuration / 1000).toFixed(2)}s`,
    };
    
    if (totalEmbeddings > 0) {
      summaryDetails.embeddingsGenerated = totalEmbeddings;
      summaryDetails.totalTokens = totalTokens;
    }
    
    jobLogger.info("User feed refresh completed", summaryDetails);
    logger.info("User feed refresh completed", summaryDetails);

    // Create notification for the user
    try {
      const notification = await createFeedRefreshNotification(userId, {
        totalFeeds: stats.totalFeeds,
        successful: stats.successful,
        failed: stats.failed,
        newArticles: stats.totalNewArticles,
        updatedArticles: stats.totalUpdatedArticles,
        articlesCleanedUp: totalCleaned,
        embeddingsGenerated: totalEmbeddings > 0 ? totalEmbeddings : undefined,
        totalTokens: totalTokens > 0 ? totalTokens : undefined,
        duration: `${(stats.averageDuration / 1000).toFixed(2)}s`,
      });
      
      if (notification) {
        jobLogger.info(`Notification created for user ${userId}`);
      }
      
      // Cleanup old notifications (keep last 100)
      await cleanupOldNotifications(userId);
    } catch (error) {
      logger.error(`Failed to create notification for user ${userId}`, { error });
      // Don't fail the job if notification fails
    }

    return {
      success: true,
      stats: {
        userId,
        totalFeeds: stats.totalFeeds,
        successful: stats.successful,
        failed: stats.failed,
        newArticles: stats.totalNewArticles,
        updatedArticles: stats.totalUpdatedArticles,
        articlesCleanedUp: totalCleaned,
        embeddingsGenerated: totalEmbeddings,
        totalTokens,
        errors: stats.errors.slice(0, 5),
      },
      logs: jobLogger.getLogs(),
    };
  }, "MANUAL");
}

/**
 * Start the feed refresh cron job
 */
export function startFeedRefreshScheduler(cronExpression?: string): void {
  scheduler.start(cronExpression);
}

/**
 * Stop the feed refresh scheduler
 */
export function stopFeedRefreshScheduler(): void {
  scheduler.stop();
}

/**
 * Check if scheduler is running
 */
export function isSchedulerRunning(): boolean {
  return scheduler.isRunning();
}

/**
 * Predefined schedule configurations
 */
export const REFRESH_SCHEDULES = {
  EVERY_15_MINUTES: "*/15 * * * *",
  EVERY_30_MINUTES: "*/30 * * * *",
  EVERY_HOUR: "0 * * * *",
  EVERY_2_HOURS: "0 */2 * * *",
  EVERY_6_HOURS: "0 */6 * * *",
  DAILY: "0 0 * * *",
};

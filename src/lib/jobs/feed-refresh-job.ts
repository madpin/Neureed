import { refreshAllDueFeeds, refreshUserFeeds, getRefreshStats, refreshFeeds } from "../services/feed-refresh-service";
import { getUserFeedsToRefresh } from "../services/feed-service";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { createJobExecutor, type JobResult } from "./job-executor";
import { createScheduledJob } from "./job-scheduler";
import { JobLogger } from "./job-logger";

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
  const results = await refreshFeeds(feedIds);
  const stats = getRefreshStats(results);

  // Calculate cleanup stats
  const totalCleaned = results.reduce(
    (sum, r) => sum + (r.cleanupResult?.deleted || 0),
    0
  );

  if (stats.errors.length > 0) {
    jobLogger.error("Feed refresh errors", { errorCount: stats.errors.length });
    logger.error("Feed refresh errors", { errors: stats.errors });
  }

  jobLogger.info("Feed refresh completed", {
    totalFeeds: stats.totalFeeds,
    successful: stats.successful,
    failed: stats.failed,
    newArticles: stats.totalNewArticles,
    updatedArticles: stats.totalUpdatedArticles,
    articlesCleanedUp: totalCleaned,
  });
  logger.info("Feed refresh completed", {
    totalFeeds: stats.totalFeeds,
    successful: stats.successful,
    failed: stats.failed,
    newArticles: stats.totalNewArticles,
    updatedArticles: stats.totalUpdatedArticles,
    articlesCleanedUp: totalCleaned,
  });

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
    const result = await refreshUserFeeds(userId);
    const stats = getRefreshStats(result.results);

    const totalCleaned = result.results.reduce(
      (sum, r) => sum + (r.cleanupResult?.deleted || 0),
      0
    );

    if (stats.errors.length > 0) {
      logger.error("User feed refresh errors", { userId, errors: stats.errors });
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
        errors: stats.errors.slice(0, 5),
      },
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

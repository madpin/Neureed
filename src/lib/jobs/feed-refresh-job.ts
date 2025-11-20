import { refreshAllDueFeeds, refreshUserFeeds, getRefreshStats } from "../services/feed-refresh-service";
import { logger } from "@/lib/logger";
import { createJobExecutor, type JobResult } from "./job-executor";
import { createScheduledJob } from "./job-scheduler";

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
 * Core feed refresh logic (system-wide)
 */
async function runFeedRefresh(): Promise<JobResult> {
  const result = await refreshAllDueFeeds();
  const stats = getRefreshStats(result.results);

  // Calculate cleanup stats
  const totalCleaned = result.results.reduce(
    (sum, r) => sum + (r.cleanupResult?.deleted || 0),
    0
  );

  if (stats.errors.length > 0) {
    logger.error("Feed refresh errors", { errors: stats.errors });
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

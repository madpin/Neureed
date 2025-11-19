import cron from "node-cron";
import { refreshAllDueFeeds, refreshUserFeeds, getRefreshStats } from "../services/feed-refresh-service";
import { logger } from "@/lib/logger";

/**
 * Cron job for refreshing feeds
 */

let isRunning = false;
let scheduledTask: cron.ScheduledTask | null = null;

/**
 * Execute feed refresh job (system-wide)
 * Note: Cleanup runs automatically after each feed refresh
 */
export async function executeFeedRefreshJob(): Promise<void> {
  if (isRunning) {
    logger.info("Feed refresh job already running, skipping...");
    return;
  }

  isRunning = true;
  const startTime = Date.now();

  try {
    logger.info("Starting system-wide feed refresh job (cleanup runs automatically after each feed refresh)...");

    const result = await refreshAllDueFeeds();
    const stats = getRefreshStats(result.results);

    const duration = Date.now() - startTime;

    // Calculate cleanup stats
    const totalCleaned = result.results.reduce(
      (sum, r) => sum + (r.cleanupResult?.deleted || 0),
      0
    );

    logger.info("Feed refresh job completed", {
      duration: `${duration}ms`,
      totalFeeds: stats.totalFeeds,
      successful: stats.successful,
      failed: stats.failed,
      newArticles: stats.totalNewArticles,
      updatedArticles: stats.totalUpdatedArticles,
      articlesCleanedUp: totalCleaned,
    });

    if (stats.errors.length > 0) {
      logger.error("Feed refresh errors", { errors: stats.errors });
    }
  } catch (error) {
    logger.error("Feed refresh job failed", { error });
  } finally {
    isRunning = false;
  }
}

/**
 * Execute feed refresh job for a specific user
 * Uses user's configured refresh intervals and cleanup settings
 * Note: Cleanup runs automatically after each feed refresh
 */
export async function executeUserFeedRefreshJob(userId: string): Promise<void> {
  const startTime = Date.now();

  try {
    logger.info("Starting user feed refresh job (cleanup runs automatically after each feed refresh)", { userId });

    const result = await refreshUserFeeds(userId);
    const stats = getRefreshStats(result.results);

    const duration = Date.now() - startTime;

    // Calculate cleanup stats
    const totalCleaned = result.results.reduce(
      (sum, r) => sum + (r.cleanupResult?.deleted || 0),
      0
    );

    logger.info("User feed refresh job completed", {
      userId,
      duration: `${duration}ms`,
      totalFeeds: stats.totalFeeds,
      successful: stats.successful,
      failed: stats.failed,
      newArticles: stats.totalNewArticles,
      updatedArticles: stats.totalUpdatedArticles,
      articlesCleanedUp: totalCleaned,
    });

    if (stats.errors.length > 0) {
      logger.error("User feed refresh errors", { userId, errors: stats.errors });
    }
  } catch (error) {
    logger.error("User feed refresh job failed", { userId, error });
  }
}

/**
 * Start the feed refresh cron job
 * Default: every 30 minutes
 */
export function startFeedRefreshScheduler(
  cronExpression = "*/30 * * * *" // Every 30 minutes
): void {
  if (scheduledTask) {
    logger.info("Feed refresh scheduler already running");
    return;
  }

  // Validate cron expression
  if (!cron.validate(cronExpression)) {
    throw new Error(`Invalid cron expression: ${cronExpression}`);
  }

  scheduledTask = cron.schedule(cronExpression, async () => {
    await executeFeedRefreshJob();
  });

  logger.info(`Feed refresh scheduler started with expression: ${cronExpression}`);
}

/**
 * Stop the feed refresh scheduler
 */
export function stopFeedRefreshScheduler(): void {
  if (scheduledTask) {
    scheduledTask.stop();
    scheduledTask = null;
    logger.info("Feed refresh scheduler stopped");
  }
}

/**
 * Check if scheduler is running
 */
export function isSchedulerRunning(): boolean {
  return scheduledTask !== null;
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


import cron from "node-cron";
import { refreshAllDueFeeds, getRefreshStats } from "../services/feed-refresh-service";

/**
 * Cron job for refreshing feeds
 */

let isRunning = false;
let scheduledTask: cron.ScheduledTask | null = null;

/**
 * Execute feed refresh job
 */
export async function executeFeedRefreshJob(): Promise<void> {
  if (isRunning) {
    console.log("Feed refresh job already running, skipping...");
    return;
  }

  isRunning = true;
  const startTime = Date.now();

  try {
    console.log("Starting feed refresh job...");

    const result = await refreshAllDueFeeds();
    const stats = getRefreshStats(result.results);

    const duration = Date.now() - startTime;

    console.log("Feed refresh job completed:", {
      duration: `${duration}ms`,
      totalFeeds: stats.totalFeeds,
      successful: stats.successful,
      failed: stats.failed,
      newArticles: stats.totalNewArticles,
      updatedArticles: stats.totalUpdatedArticles,
    });

    if (stats.errors.length > 0) {
      console.error("Feed refresh errors:", stats.errors);
    }
  } catch (error) {
    console.error("Feed refresh job failed:", error);
  } finally {
    isRunning = false;
  }
}

/**
 * Start the feed refresh cron job
 * Default: every hour
 */
export function startFeedRefreshScheduler(
  cronExpression = "0 * * * *" // Every hour at minute 0
): void {
  if (scheduledTask) {
    console.log("Feed refresh scheduler already running");
    return;
  }

  // Validate cron expression
  if (!cron.validate(cronExpression)) {
    throw new Error(`Invalid cron expression: ${cronExpression}`);
  }

  scheduledTask = cron.schedule(cronExpression, async () => {
    await executeFeedRefreshJob();
  });

  console.log(`Feed refresh scheduler started with expression: ${cronExpression}`);
}

/**
 * Stop the feed refresh scheduler
 */
export function stopFeedRefreshScheduler(): void {
  if (scheduledTask) {
    scheduledTask.stop();
    scheduledTask = null;
    console.log("Feed refresh scheduler stopped");
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


/**
 * Cron Job Scheduler
 * Initializes and manages all scheduled jobs
 */

import { startFeedRefreshScheduler, stopFeedRefreshScheduler, isSchedulerRunning as isFeedRefreshRunning } from "./feed-refresh-job";
import { startCleanupScheduler, stopCleanupScheduler, isSchedulerRunning as isCleanupRunning } from "./cleanup-job";
import { logger } from "@/lib/logger";
import { env } from "@/env";
import { getNextRunTime, getCronDescription } from "./cron-utils";

let isInitialized = false;

/**
 * Initialize all cron jobs
 * Should be called once on application startup
 */
export function initializeScheduler(): void {
  if (isInitialized) {
    logger.warn("Scheduler already initialized");
    return;
  }

  // Check if cron jobs are enabled
  if (!env.ENABLE_CRON_JOBS) {
    logger.info("Cron jobs are disabled (ENABLE_CRON_JOBS=false)");
    return;
  }

  try {
    logger.info("Initializing cron job scheduler...");

    // Start feed refresh job (every 30 minutes)
    // Note: Cleanup runs automatically after each feed refresh
    startFeedRefreshScheduler(env.FEED_REFRESH_SCHEDULE);

    // Start cleanup job (daily at 3 AM)
    // This is for system-wide maintenance of unsubscribed feeds
    startCleanupScheduler(env.CLEANUP_SCHEDULE);

    isInitialized = true;
    logger.info("Cron job scheduler initialized successfully", {
      feedRefreshSchedule: env.FEED_REFRESH_SCHEDULE,
      cleanupSchedule: env.CLEANUP_SCHEDULE,
    });
  } catch (error) {
    logger.error("Failed to initialize cron job scheduler", { error });
    throw error;
  }
}

/**
 * Stop all cron jobs
 * Should be called on application shutdown
 */
export function stopScheduler(): void {
  if (!isInitialized) {
    logger.warn("Scheduler not initialized");
    return;
  }

  try {
    logger.info("Stopping cron job scheduler...");

    stopFeedRefreshScheduler();
    stopCleanupScheduler();

    isInitialized = false;
    logger.info("Cron job scheduler stopped successfully");
  } catch (error) {
    logger.error("Failed to stop cron job scheduler", { error });
    throw error;
  }
}

/**
 * Check if scheduler is initialized
 */
export function isSchedulerInitialized(): boolean {
  return isInitialized;
}

/**
 * Get scheduler status
 */
export function getSchedulerStatus(): {
  initialized: boolean;
  enabled: boolean;
} {
  return {
    initialized: isInitialized,
    enabled: env.ENABLE_CRON_JOBS,
  };
}

/**
 * Get detailed status for all cron jobs
 */
export function getCronJobStatus() {
  const feedRefreshNextRun = getNextRunTime(env.FEED_REFRESH_SCHEDULE);
  const cleanupNextRun = getNextRunTime(env.CLEANUP_SCHEDULE);

  return {
    enabled: env.ENABLE_CRON_JOBS,
    initialized: isInitialized,
    jobs: [
      {
        name: "feed-refresh",
        displayName: "Feed Refresh",
        description: "Refreshes RSS feeds and fetches new articles",
        enabled: env.ENABLE_CRON_JOBS,
        running: isFeedRefreshRunning(),
        schedule: env.FEED_REFRESH_SCHEDULE,
        scheduleDescription: getCronDescription(env.FEED_REFRESH_SCHEDULE),
        nextRun: feedRefreshNextRun,
      },
      {
        name: "cleanup",
        displayName: "Article Cleanup",
        description: "Removes old articles and performs database maintenance",
        enabled: env.ENABLE_CRON_JOBS,
        running: isCleanupRunning(),
        schedule: env.CLEANUP_SCHEDULE,
        scheduleDescription: getCronDescription(env.CLEANUP_SCHEDULE),
        nextRun: cleanupNextRun,
      },
    ],
  };
}


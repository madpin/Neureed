import cron from "node-cron";
import { cleanupOldArticles, vacuumDatabase } from "../services/article-cleanup-service";
import { logger } from "@/lib/logger";

/**
 * Cron job for cleaning up old articles
 * This runs system-wide cleanup for feeds not subscribed by any user
 * Note: Per-user cleanup happens automatically after each feed refresh
 */

let isRunning = false;
let scheduledTask: cron.ScheduledTask | null = null;

/**
 * Execute cleanup job (system-wide)
 * Cleans up articles using system defaults
 * Note: This is for system-wide maintenance. Per-user cleanup runs automatically after feed refresh.
 */
export async function executeCleanupJob(): Promise<void> {
  if (isRunning) {
    logger.info("Cleanup job already running, skipping...");
    return;
  }

  isRunning = true;
  const startTime = Date.now();

  try {
    logger.info("Starting system-wide article cleanup job (per-user cleanup runs automatically after feed refresh)...");

    const result = await cleanupOldArticles({
      maxAge: 90, // 90 days (system default)
      maxArticlesPerFeed: 500, // 500 articles (system default)
      preserveStarred: true,
      dryRun: false,
    });

    const duration = Date.now() - startTime;

    logger.info("Article cleanup job completed", {
      duration: `${duration}ms`,
      deleted: result.deleted,
      preserved: result.preserved,
      byAge: result.details.byAge,
      byCount: result.details.byCount,
    });

    // Vacuum database after cleanup
    if (result.deleted > 100) {
      logger.info("Running database vacuum...");
      await vacuumDatabase();
    }
  } catch (error) {
    logger.error("Cleanup job failed", { error });
  } finally {
    isRunning = false;
  }
}

/**
 * Start the cleanup cron job
 * Default: daily at 3 AM
 * Note: This is for system-wide cleanup. Per-user cleanup runs automatically after feed refresh.
 */
export function startCleanupScheduler(
  cronExpression = "0 3 * * *" // Daily at 3 AM
): void {
  if (scheduledTask) {
    logger.info("Cleanup scheduler already running");
    return;
  }

  // Validate cron expression
  if (!cron.validate(cronExpression)) {
    throw new Error(`Invalid cron expression: ${cronExpression}`);
  }

  scheduledTask = cron.schedule(cronExpression, async () => {
    await executeCleanupJob();
  });

  logger.info(`Cleanup scheduler started with expression: ${cronExpression}`);
}

/**
 * Stop the cleanup scheduler
 */
export function stopCleanupScheduler(): void {
  if (scheduledTask) {
    scheduledTask.stop();
    scheduledTask = null;
    logger.info("Cleanup scheduler stopped");
  }
}

/**
 * Check if scheduler is running
 */
export function isSchedulerRunning(): boolean {
  return scheduledTask !== null;
}


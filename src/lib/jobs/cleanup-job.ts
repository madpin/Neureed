import { cleanupOldArticles, vacuumDatabase } from "../services/article-cleanup-service";
import { logger } from "@/lib/logger";
import { createJobExecutor, type JobResult } from "./job-executor";
import { createScheduledJob } from "./job-scheduler";

/**
 * Cron job for cleaning up old articles
 * This runs system-wide cleanup for feeds not subscribed by any user
 * Note: Per-user cleanup happens automatically after each feed refresh
 */

// Create job executor with concurrency control
const executeJob = createJobExecutor("cleanup");

// Create scheduler
const scheduler = createScheduledJob(
  "Cleanup",
  executeCleanupJob,
  "0 3 * * *"
);

/**
 * Core cleanup logic
 */
async function runCleanup(): Promise<JobResult> {
  const result = await cleanupOldArticles({
    maxAge: 90, // 90 days (system default)
    maxArticlesPerFeed: 500, // 500 articles (system default)
    preserveStarred: true,
    dryRun: false,
  });

  // Vacuum database after cleanup
  let vacuumRun = false;
  if (result.deleted > 100) {
    logger.info("Running database vacuum...");
    await vacuumDatabase();
    vacuumRun = true;
  }

  return {
    success: true,
    stats: {
      deleted: result.deleted,
      preserved: result.preserved,
      byAge: result.details.byAge,
      byCount: result.details.byCount,
      vacuumRun,
    },
  };
}

/**
 * Execute cleanup job (system-wide)
 */
export async function executeCleanupJob(): Promise<void> {
  await executeJob(runCleanup, "SCHEDULER");
}

/**
 * Start the cleanup cron job
 */
export function startCleanupScheduler(cronExpression?: string): void {
  scheduler.start(cronExpression);
}

/**
 * Stop the cleanup scheduler
 */
export function stopCleanupScheduler(): void {
  scheduler.stop();
}

/**
 * Check if scheduler is running
 */
export function isSchedulerRunning(): boolean {
  return scheduler.isRunning();
}

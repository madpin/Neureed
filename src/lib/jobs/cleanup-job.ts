import cron from "node-cron";
import { cleanupOldArticles, vacuumDatabase } from "../services/article-cleanup-service";

/**
 * Cron job for cleaning up old articles
 */

let isRunning = false;
let scheduledTask: cron.ScheduledTask | null = null;

/**
 * Execute cleanup job
 */
export async function executeCleanupJob(): Promise<void> {
  if (isRunning) {
    console.log("Cleanup job already running, skipping...");
    return;
  }

  isRunning = true;
  const startTime = Date.now();

  try {
    console.log("Starting article cleanup job...");

    const result = await cleanupOldArticles({
      maxAge: 90, // 90 days
      maxArticlesPerFeed: 1000,
      preserveStarred: true,
      dryRun: false,
    });

    const duration = Date.now() - startTime;

    console.log("Article cleanup job completed:", {
      duration: `${duration}ms`,
      deleted: result.deleted,
      preserved: result.preserved,
      byAge: result.details.byAge,
      byCount: result.details.byCount,
    });

    // Vacuum database after cleanup
    if (result.deleted > 100) {
      console.log("Running database vacuum...");
      await vacuumDatabase();
    }
  } catch (error) {
    console.error("Cleanup job failed:", error);
  } finally {
    isRunning = false;
  }
}

/**
 * Start the cleanup cron job
 * Default: daily at 3 AM
 */
export function startCleanupScheduler(
  cronExpression = "0 3 * * *" // Daily at 3 AM
): void {
  if (scheduledTask) {
    console.log("Cleanup scheduler already running");
    return;
  }

  // Validate cron expression
  if (!cron.validate(cronExpression)) {
    throw new Error(`Invalid cron expression: ${cronExpression}`);
  }

  scheduledTask = cron.schedule(cronExpression, async () => {
    await executeCleanupJob();
  });

  console.log(`Cleanup scheduler started with expression: ${cronExpression}`);
}

/**
 * Stop the cleanup scheduler
 */
export function stopCleanupScheduler(): void {
  if (scheduledTask) {
    scheduledTask.stop();
    scheduledTask = null;
    console.log("Cleanup scheduler stopped");
  }
}

/**
 * Check if scheduler is running
 */
export function isSchedulerRunning(): boolean {
  return scheduledTask !== null;
}


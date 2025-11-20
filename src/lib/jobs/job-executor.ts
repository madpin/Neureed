/**
 * Base job executor with automatic tracking, error handling, and logging
 */

import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import type { CronJobStatus, CronJobTrigger } from "@prisma/client";

export interface JobResult<T = unknown> {
  success: boolean;
  stats?: T;
  error?: string;
}

export interface JobExecutorOptions {
  jobName: string;
  triggeredBy?: CronJobTrigger;
  skipIfRunning?: boolean;
}

/**
 * Execute a job with automatic database tracking
 * Handles all the boilerplate: creating run records, timing, error handling, status updates
 */
export async function executeTrackedJob<T>(
  handler: () => Promise<JobResult<T>>,
  options: JobExecutorOptions
): Promise<void> {
  const { jobName, triggeredBy = "SCHEDULER" } = options;
  const startTime = Date.now();

  // Create job run record
  const jobRun = await prisma.cronJobRun.create({
    data: {
      jobName,
      status: "RUNNING",
      triggeredBy,
      startedAt: new Date(),
      updatedAt: new Date(),
    },
  });

  try {
    logger.info(`Starting job: ${jobName}`);

    // Execute the actual job logic
    const result = await handler();
    const duration = Date.now() - startTime;

    if (result.success) {
      logger.info(`Job completed: ${jobName}`, {
        duration: `${duration}ms`,
        ...result.stats,
      });

      // Update with success
      await prisma.cronJobRun.update({
        where: { id: jobRun.id },
        data: {
          status: "SUCCESS",
          completedAt: new Date(),
          durationMs: duration,
          updatedAt: new Date(),
          stats: result.stats || {},
        },
      });
    } else {
      logger.error(`Job failed: ${jobName}`, { error: result.error });

      // Update with failure
      await prisma.cronJobRun.update({
        where: { id: jobRun.id },
        data: {
          status: "FAILED",
          completedAt: new Date(),
          durationMs: duration,
          updatedAt: new Date(),
          errorMessage: result.error,
        },
      });
    }
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : String(error);

    logger.error(`Job threw exception: ${jobName}`, { error });

    // Update with failure
    await prisma.cronJobRun.update({
      where: { id: jobRun.id },
      data: {
        status: "FAILED",
        completedAt: new Date(),
        durationMs: duration,
        updatedAt: new Date(),
        errorMessage,
      },
    });
  }
}

/**
 * Create a job executor with concurrency control
 */
export function createJobExecutor(jobName: string) {
  let isRunning = false;

  return async function <T>(
    handler: () => Promise<JobResult<T>>,
    triggeredBy: CronJobTrigger = "SCHEDULER"
  ): Promise<void> {
    if (isRunning) {
      logger.info(`Job already running, skipping: ${jobName}`);
      return;
    }

    isRunning = true;
    try {
      await executeTrackedJob(handler, { jobName, triggeredBy });
    } finally {
      isRunning = false;
    }
  };
}


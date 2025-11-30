/**
 * Base job executor with automatic tracking, error handling, and logging
 */

import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { env } from "@/env";
import type { CronJobStatus, CronJobTrigger } from "@/generated/prisma/client";
import type { LogEntry } from "./job-logger";

export interface JobResult<T = unknown> {
  success: boolean;
  stats?: T;
  error?: string;
  logs?: LogEntry[]; // Optional logs captured during execution
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
      // updatedAt is auto-managed by Prisma via @updatedAt directive
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
          // updatedAt is auto-managed by Prisma via @updatedAt directive
          stats: result.stats || {},
          logs: (result.logs || []) as any,
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
          // updatedAt is auto-managed by Prisma via @updatedAt directive
          errorMessage: result.error,
          logs: (result.logs || []) as any,
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
        // updatedAt is auto-managed by Prisma via @updatedAt directive
        errorMessage,
        logs: [] as any, // No logs captured if exception thrown before handler completes
      },
    });
  }
}

/**
 * Acquire a distributed lock for a job
 * @param jobName - Name of the job to lock
 * @param timeout - Lock timeout in milliseconds
 * @returns true if lock acquired, false if already locked
 */
async function acquireLock(jobName: string, timeout: number = 600000): Promise<boolean> {
  const processId = `${process.pid}-${Date.now()}`;
  const expiresAt = new Date(Date.now() + timeout);

  try {
    await prisma.jobLock.create({
      data: { jobName, lockedAt: new Date(), lockedBy: processId, expiresAt }
    });
    return true;
  } catch (error) {
    // Lock exists, check if expired
    const existingLock = await prisma.jobLock.findUnique({
      where: { jobName }
    });

    if (existingLock && existingLock.expiresAt < new Date()) {
      // Expired, take over
      await prisma.jobLock.update({
        where: { jobName },
        data: { lockedAt: new Date(), lockedBy: processId, expiresAt }
      });
      return true;
    }

    return false;
  }
}

/**
 * Release a distributed lock for a job
 * @param jobName - Name of the job to unlock
 */
async function releaseLock(jobName: string): Promise<void> {
  await prisma.jobLock.delete({ where: { jobName } }).catch(() => {
    // Ignore errors if lock doesn't exist
  });
}

/**
 * Create a job executor with concurrency control (in-memory + distributed locking)
 */
export function createJobExecutor(jobName: string) {
  let isRunning = false;

  return async function <T>(
    handler: () => Promise<JobResult<T>>,
    triggeredBy: CronJobTrigger = "SCHEDULER"
  ): Promise<void> {
    // In-memory check (fast path for same process)
    if (isRunning) {
      logger.info(`Job already running (in-memory), skipping: ${jobName}`);
      return;
    }

    // Distributed lock check (prevents overlap across processes/restarts)
    const acquired = await acquireLock(jobName, env.JOB_LOCK_TIMEOUT);
    if (!acquired) {
      logger.info(`Job locked by another process, skipping: ${jobName}`);
      return;
    }

    isRunning = true;
    try {
      await executeTrackedJob(handler, { jobName, triggeredBy });
    } finally {
      isRunning = false;
      await releaseLock(jobName);
    }
  };
}


/**
 * Process Lifecycle Manager
 *
 * Handles graceful shutdown of the application by:
 * - Stopping cron jobs
 * - Waiting for active jobs to complete
 * - Closing database connections
 * - Releasing resources
 */

import { logger } from '@/lib/logger';
import { prisma, pool } from '@/lib/db';
import { stopFeedRefreshScheduler } from '@/lib/jobs/feed-refresh-job';

let isShuttingDown = false;
const SHUTDOWN_TIMEOUT = 30000; // 30 seconds max wait time

/**
 * Gracefully shutdown the application
 *
 * @param signal - The signal that triggered the shutdown (e.g., 'SIGTERM', 'SIGINT')
 */
export async function gracefulShutdown(signal: string): Promise<void> {
  // Prevent multiple shutdown attempts
  if (isShuttingDown) {
    logger.warn(`Shutdown already in progress, ignoring ${signal}`);
    return;
  }

  isShuttingDown = true;
  logger.info(`Received ${signal}, starting graceful shutdown...`);

  const shutdownStart = Date.now();

  try {
    // Step 1: Stop accepting new work (stop cron schedulers)
    logger.info('Stopping cron schedulers...');
    try {
      stopFeedRefreshScheduler();
      logger.info('Cron schedulers stopped');
    } catch (error) {
      logger.error('Error stopping schedulers', { error });
    }

    // Step 2: Wait for active jobs to complete (with timeout)
    logger.info('Waiting for active jobs to complete...');
    const jobsCompleted = await waitForActiveJobs(SHUTDOWN_TIMEOUT);

    if (jobsCompleted) {
      logger.info('All active jobs completed');
    } else {
      logger.warn('Some jobs did not complete within timeout, proceeding with shutdown');
    }

    // Step 3: Close database connections
    logger.info('Closing database connections...');
    try {
      await prisma.$disconnect();
      logger.info('Prisma client disconnected');
    } catch (error) {
      logger.error('Error disconnecting Prisma', { error });
    }

    try {
      await pool.end();
      logger.info('PostgreSQL connection pool closed');
    } catch (error) {
      logger.error('Error closing connection pool', { error });
    }

    const shutdownDuration = Date.now() - shutdownStart;
    logger.info(`Graceful shutdown completed in ${shutdownDuration}ms`);

    // Exit successfully
    process.exit(0);
  } catch (error) {
    logger.error('Error during graceful shutdown', { error });

    // Force exit on error
    process.exit(1);
  }
}

/**
 * Wait for active jobs to complete
 *
 * @param timeout - Maximum time to wait in milliseconds
 * @returns true if all jobs completed, false if timeout reached
 */
async function waitForActiveJobs(timeout: number): Promise<boolean> {
  const startTime = Date.now();
  const checkInterval = 1000; // Check every 1 second

  while (Date.now() - startTime < timeout) {
    try {
      // Check for running jobs in the database
      const runningJobs = await prisma.cronJobRun.count({
        where: {
          status: 'RUNNING',
        },
      });

      if (runningJobs === 0) {
        return true;
      }

      logger.debug(`Waiting for ${runningJobs} active job(s) to complete...`);

      // Wait before checking again
      await new Promise(resolve => setTimeout(resolve, checkInterval));
    } catch (error) {
      logger.error('Error checking active jobs', { error });
      // If we can't check jobs, assume we should proceed with shutdown
      return false;
    }
  }

  // Timeout reached
  logger.warn(`Timeout reached after ${timeout}ms, some jobs may still be running`);
  return false;
}

/**
 * Register process signal handlers for graceful shutdown
 */
export function registerShutdownHandlers(): void {
  // Handle SIGTERM (Docker, Kubernetes graceful stop)
  process.on('SIGTERM', () => {
    gracefulShutdown('SIGTERM');
  });

  // Handle SIGINT (Ctrl+C)
  process.on('SIGINT', () => {
    gracefulShutdown('SIGINT');
  });

  // Handle uncaught exceptions
  process.on('uncaughtException', (error) => {
    logger.error('Uncaught exception, shutting down...', { error });
    gracefulShutdown('uncaughtException');
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled promise rejection, shutting down...', {
      reason,
      promise,
    });
    gracefulShutdown('unhandledRejection');
  });

  logger.info('Shutdown handlers registered');
}

/**
 * Check if shutdown is in progress
 */
export function isShuttingDownNow(): boolean {
  return isShuttingDown;
}

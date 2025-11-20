/**
 * Common cron job scheduler wrapper
 * Eliminates boilerplate in job setup
 */

import cron from "node-cron";
import { logger } from "@/lib/logger";

export interface ScheduledJob {
  start: (cronExpression?: string) => void;
  stop: () => void;
  isRunning: () => boolean;
}

/**
 * Create a scheduled job
 */
export function createScheduledJob(
  name: string,
  handler: () => Promise<void>,
  defaultSchedule: string
): ScheduledJob {
  let scheduledTask: cron.ScheduledTask | null = null;

  return {
    start(cronExpression: string = defaultSchedule) {
      if (scheduledTask) {
        logger.info(`${name} scheduler already running`);
        return;
      }

      if (!cron.validate(cronExpression)) {
        throw new Error(`Invalid cron expression for ${name}: ${cronExpression}`);
      }

      scheduledTask = cron.schedule(cronExpression, async () => {
        await handler();
      });

      logger.info(`${name} scheduler started with expression: ${cronExpression}`);
    },

    stop() {
      if (scheduledTask) {
        scheduledTask.stop();
        scheduledTask = null;
        logger.info(`${name} scheduler stopped`);
      }
    },

    isRunning() {
      return scheduledTask !== null;
    },
  };
}


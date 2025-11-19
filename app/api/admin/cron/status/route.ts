import { createHandler } from "@/lib/api-handler";
import { getSchedulerStatus, isSchedulerInitialized } from "@/lib/jobs/scheduler";
import { isSchedulerRunning as isFeedRefreshRunning } from "@/lib/jobs/feed-refresh-job";
import { isSchedulerRunning as isCleanupRunning } from "@/lib/jobs/cleanup-job";
import { env } from "@/env";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/cron/status
 * Get cron job scheduler status
 */
export const GET = createHandler(
  async () => {
    const status = getSchedulerStatus();
    
    return {
      data: {
        ...status,
        feedRefreshRunning: isFeedRefreshRunning(),
        cleanupRunning: isCleanupRunning(),
        schedules: {
          feedRefresh: env.FEED_REFRESH_SCHEDULE,
          cleanup: env.CLEANUP_SCHEDULE,
        },
        environment: {
          nodeEnv: env.NODE_ENV,
          nextRuntime: process.env.NEXT_RUNTIME,
        },
      },
    };
  },
  { requireAuth: true }
);


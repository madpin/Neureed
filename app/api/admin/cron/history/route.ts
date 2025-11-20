import { createHandler } from "@/lib/api-handler";
import { prisma } from "@/lib/db";
import { getCronJobStatus } from "@/lib/jobs/scheduler";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/cron/history
 * Get cron job execution history and status
 */
export const GET = createHandler(
  async () => {
    try {
      // Get current job status
      const jobStatus = getCronJobStatus();

      // Get last 20 runs for each job type
      const feedRefreshRuns = await prisma.cronJobRun.findMany({
        where: { jobName: "feed-refresh" },
        orderBy: { startedAt: "desc" },
        take: 20,
      });

      const cleanupRuns = await prisma.cronJobRun.findMany({
        where: { jobName: "cleanup" },
        orderBy: { startedAt: "desc" },
        take: 20,
      });

      // Get last run for each job
      const lastFeedRefreshRun = feedRefreshRuns[0] || null;
      const lastCleanupRun = cleanupRuns[0] || null;

      // Build response with job details
      const jobs = jobStatus.jobs.map((job) => {
        const runs = job.name === "feed-refresh" ? feedRefreshRuns : cleanupRuns;
        const lastRun = job.name === "feed-refresh" ? lastFeedRefreshRun : lastCleanupRun;

        return {
          ...job,
          lastRun: lastRun
            ? {
                id: lastRun.id,
                status: lastRun.status,
                startedAt: lastRun.startedAt,
                completedAt: lastRun.completedAt,
                duration: lastRun.durationMs,
                result: lastRun.stats,
                error: lastRun.errorMessage,
              }
            : null,
          recentRuns: runs.map((run) => ({
            id: run.id,
            status: run.status,
            startedAt: run.startedAt,
            completedAt: run.completedAt,
            duration: run.durationMs,
            result: run.stats,
            error: run.errorMessage,
          })),
        };
      });

      return {
        enabled: jobStatus.enabled,
        initialized: jobStatus.initialized,
        jobs,
      };
    } catch (error) {
      console.error("Error fetching cron history:", error);
      throw error;
    }
  },
  { requireAuth: true }
);


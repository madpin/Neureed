import { createHandler } from "@/lib/api-handler";
import { getCronJobStatus } from "@/lib/jobs/scheduler";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/cron/status
 * Get cron job scheduler status with latest run information
 */
export const GET = createHandler(
  async () => {
    const status = getCronJobStatus();
    
    // Fetch latest run for each job to get logs and last run info
    const jobsWithHistory = await Promise.all(
      status.jobs.map(async (job) => {
        const latestRun = await prisma.cronJobRun.findFirst({
          where: { jobName: job.name },
          orderBy: { startedAt: "desc" },
          select: {
            status: true,
            startedAt: true,
            completedAt: true,
            durationMs: true,
            errorMessage: true,
            logs: true,
          },
        });

        return {
          name: job.name,
          schedule: job.schedule,
          lastRun: latestRun?.startedAt?.toISOString(),
          nextRun: job.nextRun?.toISOString(),
          status: job.running ? "running" : (latestRun?.status === "FAILED" ? "error" : "idle"),
          lastError: latestRun?.errorMessage || undefined,
          logs: latestRun?.logs ? (latestRun.logs as any[]).map((log: any) => ({
            level: log.level || "info",
            message: log.message || "",
            timestamp: log.timestamp,
          })) : undefined,
        };
      })
    );
    
    return { jobs: jobsWithHistory };
  },
  { requireAdmin: true }
);


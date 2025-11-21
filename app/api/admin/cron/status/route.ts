import { createHandler } from "@/lib/api-handler";
import { getCronJobStatus } from "@/lib/jobs/scheduler";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/cron/status
 * Get cron job scheduler status
 */
export const GET = createHandler(
  async () => {
    const status = getCronJobStatus();
    
    return status; // This returns { enabled, initialized, jobs: [...] }
  },
  { requireAuth: true }
);


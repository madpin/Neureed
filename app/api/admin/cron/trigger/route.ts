import { createHandler } from "@/lib/api-handler";
import { executeFeedRefreshJob } from "@/lib/jobs/feed-refresh-job";
import { executeCleanupJob } from "@/lib/jobs/cleanup-job";
import { z } from "zod";

export const dynamic = "force-dynamic";

const triggerSchema = z.object({
  job: z.enum(["feed-refresh", "cleanup"]),
});

/**
 * POST /api/admin/cron/trigger
 * Manually trigger a cron job
 */
export const POST = createHandler(
  async ({ body }) => {
    const { job } = body;
    
    if (job === "feed-refresh") {
      // Run in background
      executeFeedRefreshJob().catch((error) => {
        console.error("Feed refresh job failed:", error);
      });
      
      return {
        success: true,
        message: "Feed refresh job triggered",
      };
    } else if (job === "cleanup") {
      // Run in background
      executeCleanupJob().catch((error) => {
        console.error("Cleanup job failed:", error);
      });
      
      return {
        success: true,
        message: "Cleanup job triggered",
      };
    }
    
    return {
      success: false,
      message: "Invalid job type",
    };
  },
  { 
    requireAdmin: true,
    bodySchema: triggerSchema,
  }
);


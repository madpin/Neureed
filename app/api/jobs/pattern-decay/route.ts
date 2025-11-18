import { runPatternDecayJob } from "@/src/lib/jobs/pattern-decay-job";
import { createHandler } from "@/src/lib/api-handler";

/**
 * POST /api/jobs/pattern-decay
 * Run the pattern decay job
 * This should be called by a cron job or scheduled task
 */
export const POST = createHandler(async () => {
  // Optional: Add authentication/authorization for cron jobs
  // const authHeader = request.headers.get("authorization");
  // if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
  //   throw new Error("Unauthorized");
  // }

  const result = await runPatternDecayJob();

  return {
    message: "Pattern decay job completed",
    ...result,
  };
});


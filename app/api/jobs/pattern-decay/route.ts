import { NextRequest } from "next/server";
import { runPatternDecayJob } from "@/src/lib/jobs/pattern-decay-job";
import { apiResponse, apiError } from "@/src/lib/api-response";

/**
 * POST /api/jobs/pattern-decay
 * Run the pattern decay job
 * This should be called by a cron job or scheduled task
 */
export async function POST(request: NextRequest) {
  try {
    // Optional: Add authentication/authorization for cron jobs
    // const authHeader = request.headers.get("authorization");
    // if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    //   return apiError("Unauthorized", 401);
    // }

    const result = await runPatternDecayJob();

    return apiResponse({
      message: "Pattern decay job completed",
      ...result,
    });
  } catch (error) {
    console.error("Error running pattern decay job:", error);
    return apiError("Failed to run pattern decay job");
  }
}


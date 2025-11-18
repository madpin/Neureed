import { NextRequest } from "next/server";
import { auth } from "@/src/lib/auth";
import { getPatternStats } from "@/src/lib/services/pattern-detection-service";
import { apiResponse, apiError } from "@/src/lib/api-response";

/**
 * GET /api/user/patterns/stats
 * Get pattern statistics for the current user
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return apiError("Unauthorized", 401);
    }

    const stats = await getPatternStats(session.user.id);

    return apiResponse({
      stats,
    });
  } catch (error) {
    console.error("Error fetching pattern stats:", error);
    return apiError("Failed to fetch pattern stats");
  }
}


import { NextRequest } from "next/server";
import { auth } from "@/src/lib/auth";
import { getFeedbackStats } from "@/src/lib/services/feedback-service";
import { apiResponse, apiError } from "@/src/lib/api-response";

/**
 * GET /api/user/feedback/stats
 * Get feedback statistics for the current user
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return apiError("Unauthorized", 401);
    }

    const stats = await getFeedbackStats(session.user.id);

    return apiResponse({
      stats,
    });
  } catch (error) {
    console.error("Error fetching feedback stats:", error);
    return apiError("Failed to fetch feedback stats");
  }
}


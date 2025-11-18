import { NextRequest } from "next/server";
import { auth } from "@/src/lib/auth";
import { getUserPatterns } from "@/src/lib/services/pattern-detection-service";
import { apiResponse, apiError } from "@/src/lib/api-response";

/**
 * GET /api/user/patterns
 * Get all learned patterns for the current user
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return apiError("Unauthorized", 401);
    }

    const patterns = await getUserPatterns(session.user.id);

    return apiResponse({
      patterns,
    });
  } catch (error) {
    console.error("Error fetching patterns:", error);
    return apiError("Failed to fetch patterns");
  }
}


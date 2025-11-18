import { NextRequest } from "next/server";
import { auth } from "@/src/lib/auth";
import { resetUserPatterns } from "@/src/lib/services/pattern-detection-service";
import { apiResponse, apiError } from "@/src/lib/api-response";

/**
 * POST /api/user/patterns/reset
 * Reset all learned patterns for the user
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return apiError("Unauthorized", 401);
    }

    await resetUserPatterns(session.user.id);

    return apiResponse({
      message: "Patterns reset successfully",
    });
  } catch (error) {
    console.error("Error resetting patterns:", error);
    return apiError("Failed to reset patterns");
  }
}


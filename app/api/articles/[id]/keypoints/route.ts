/**
 * Article Key Points API
 * GET /api/articles/[id]/keypoints - Get article key points
 */

import { NextRequest } from "next/server";
import { apiResponse, apiError } from "@/src/lib/api-response";
import { extractKeyPoints } from "@/src/lib/services/summarization-service";
import { getCurrentUser } from "@/src/lib/middleware/auth-middleware";

/**
 * GET /api/articles/[id]/keypoints
 * Get article key points
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: articleId } = await params;
    const { searchParams } = new URL(request.url);
    const count = parseInt(searchParams.get("count") || "5");

    const user = await getCurrentUser();
    const keyPoints = await extractKeyPoints(articleId, count, {
      userId: user?.id,
    });

    return apiResponse({ keyPoints });
  } catch (error) {
    console.error("Error fetching key points:", error);
    return apiError(
      error instanceof Error ? error.message : "Failed to fetch key points",
      500
    );
  }
}


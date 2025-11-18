import { NextRequest } from "next/server";
import { getFeed } from "@/src/lib/services/feed-service";
import { refreshFeed } from "@/src/lib/services/feed-refresh-service";
import { apiResponse, apiError } from "@/src/lib/api-response";

/**
 * POST /api/feeds/:id/refresh
 * Manually refresh a feed
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check if feed exists
    const feed = await getFeed(id);
    if (!feed) {
      return apiError("Feed not found", 404);
    }

    // Refresh feed
    const result = await refreshFeed(id);

    if (!result.success) {
      return apiError(
        result.error || "Failed to refresh feed",
        500,
        result.error
      );
    }

    return apiResponse({
      success: true,
      newArticles: result.newArticles,
      updatedArticles: result.updatedArticles,
      duration: result.duration,
    });
  } catch (error) {
    console.error("Error refreshing feed:", error);
    return apiError(
      "Failed to refresh feed",
      500,
      error instanceof Error ? error.message : undefined
    );
  }
}


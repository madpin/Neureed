import { NextRequest, NextResponse } from "next/server";
import {
  getFeed,
  updateFeed,
  deleteFeedWithArticles,
  getFeedStats,
  updateFeedCategories,
} from "@/src/lib/services/feed-service";
import { updateFeedSchema } from "@/src/lib/validations/feed-validation";
import { apiResponse, apiError } from "@/src/lib/api-response";

/**
 * GET /api/feeds/:id
 * Get a single feed with statistics
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const [feed, stats] = await Promise.all([
      getFeed(id),
      getFeedStats(id),
    ]);

    if (!feed) {
      return apiError("Feed not found", 404);
    }

    return apiResponse({
      feed,
      stats,
    });
  } catch (error) {
    console.error("Error fetching feed:", error);
    return apiError(
      "Failed to fetch feed",
      500,
      error instanceof Error ? error.message : undefined
    );
  }
}

/**
 * PATCH /api/feeds/:id
 * Update a feed
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Validate input
    const validationResult = updateFeedSchema.safeParse(body);
    if (!validationResult.success) {
      return apiError(
        "Invalid input",
        400,
        validationResult.error.errors
      );
    }

    const { categoryIds, ...updateData } = validationResult.data;

    // Update feed
    const feed = await updateFeed(id, updateData);

    // Update categories if provided
    if (categoryIds !== undefined) {
      await updateFeedCategories(id, categoryIds);
    }

    return apiResponse({ feed });
  } catch (error) {
    console.error("Error updating feed:", error);

    if (error instanceof Error && error.message.includes("not found")) {
      return apiError("Feed not found", 404);
    }

    return apiError(
      "Failed to update feed",
      500,
      error instanceof Error ? error.message : undefined
    );
  }
}

/**
 * DELETE /api/feeds/:id
 * Delete a feed and all its articles
 */
export async function DELETE(
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

    // Delete feed and articles
    await deleteFeedWithArticles(id);

    return apiResponse({ success: true });
  } catch (error) {
    console.error("Error deleting feed:", error);
    return apiError(
      "Failed to delete feed",
      500,
      error instanceof Error ? error.message : undefined
    );
  }
}


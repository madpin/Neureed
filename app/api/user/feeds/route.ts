import { NextRequest } from "next/server";
import { apiResponse, apiError } from "@/src/lib/api-response";
import { withAuth } from "@/src/lib/middleware/auth-middleware";
import {
  getUserFeeds,
  subscribeFeed,
  unsubscribeFeed,
  getAllFeedsWithSubscriptionStatus,
} from "@/src/lib/services/user-feed-service";
import { z } from "zod";

/**
 * GET /api/user/feeds
 * Get user's subscribed feeds or all feeds with subscription status
 */
export async function GET(request: NextRequest) {
  return withAuth(async (user) => {
    try {
      const { searchParams } = new URL(request.url);
      const includeAll = searchParams.get("includeAll") === "true";

      if (includeAll) {
        // Return all feeds with subscription status
        const feeds = await getAllFeedsWithSubscriptionStatus(user.id);
        return apiResponse({ feeds });
      } else {
        // Return only subscribed feeds
        const subscriptions = await getUserFeeds(user.id);
        return apiResponse({ subscriptions });
      }
    } catch (error) {
      console.error("Error fetching user feeds:", error);
      return apiError(
        "Failed to fetch feeds",
        500,
        error instanceof Error ? error.message : undefined
      );
    }
  });
}

const subscribeSchema = z.object({
  feedId: z.string(),
  customName: z.string().optional(),
});

/**
 * POST /api/user/feeds
 * Subscribe to a feed
 */
export async function POST(request: NextRequest) {
  return withAuth(async (user) => {
    try {
      const body = await request.json();
      const result = subscribeSchema.safeParse(body);

      if (!result.success) {
        return apiError("Invalid request body", 400, result.error.errors);
      }

      const { feedId, customName } = result.data;

      const subscription = await subscribeFeed(user.id, feedId, customName);

      return apiResponse(
        { subscription, message: "Successfully subscribed to feed" },
        201
      );
    } catch (error) {
      console.error("Error subscribing to feed:", error);
      
      if (error instanceof Error && error.message.includes("Unique constraint")) {
        return apiError("Already subscribed to this feed", 409);
      }

      return apiError(
        "Failed to subscribe to feed",
        500,
        error instanceof Error ? error.message : undefined
      );
    }
  });
}

const unsubscribeSchema = z.object({
  feedId: z.string(),
});

/**
 * DELETE /api/user/feeds
 * Unsubscribe from a feed
 */
export async function DELETE(request: NextRequest) {
  return withAuth(async (user) => {
    try {
      const body = await request.json();
      const result = unsubscribeSchema.safeParse(body);

      if (!result.success) {
        return apiError("Invalid request body", 400, result.error.errors);
      }

      const { feedId } = result.data;

      await unsubscribeFeed(user.id, feedId);

      return apiResponse({ message: "Successfully unsubscribed from feed" });
    } catch (error) {
      console.error("Error unsubscribing from feed:", error);
      return apiError(
        "Failed to unsubscribe from feed",
        500,
        error instanceof Error ? error.message : undefined
      );
    }
  });
}


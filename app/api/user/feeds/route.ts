import {
  getUserFeeds,
  subscribeFeed,
  unsubscribeFeed,
  getAllFeedsWithSubscriptionStatus,
} from "@/lib/services/user-feed-service";
import { getFeedsGroupedByCategory } from "@/lib/services/user-category-service";
import { z } from "zod";
import { createHandler } from "@/lib/api-handler";

/**
 * GET /api/user/feeds
 * Get user's subscribed feeds or all feeds with subscription status
 * Optionally group by categories
 */
export const GET = createHandler(
  async ({ request, session }) => {
    const { searchParams } = new URL(request.url);
    const includeAll = searchParams.get("includeAll") === "true";
    const groupByCategory = searchParams.get("groupByCategory") === "true";

    if (groupByCategory) {
      // Return feeds grouped by categories
      const grouped = await getFeedsGroupedByCategory(session!.user!.id);
      return grouped;
    } else if (includeAll) {
      // Return all feeds with subscription status
      const feeds = await getAllFeedsWithSubscriptionStatus(session!.user!.id);
      return { feeds };
    } else {
      // Return only subscribed feeds
      const subscriptions = await getUserFeeds(session!.user!.id);
      return { subscriptions };
    }
  },
  { requireAuth: true }
);

const subscribeSchema = z.object({
  feedId: z.string(),
  customName: z.string().optional(),
  categoryId: z.string().optional(),
});

/**
 * POST /api/user/feeds
 * Subscribe to a feed
 * Optionally assign to a category
 */
export const POST = createHandler(
  async ({ body, session }) => {
    const { feedId, customName, categoryId } = body;

    const subscription = await subscribeFeed(
      session!.user!.id,
      feedId,
      customName,
      categoryId
    );

    return { subscription, message: "Successfully subscribed to feed" };
  },
  { bodySchema: subscribeSchema, requireAuth: true }
);

const unsubscribeSchema = z.object({
  feedId: z.string(),
});

/**
 * DELETE /api/user/feeds
 * Unsubscribe from a feed
 */
export const DELETE = createHandler(
  async ({ body, session }) => {
    const { feedId } = body;

    await unsubscribeFeed(session!.user!.id, feedId);

    return { message: "Successfully unsubscribed from feed" };
  },
  { bodySchema: unsubscribeSchema, requireAuth: true }
);


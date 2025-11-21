import {
  getFeed,
  updateFeed,
  deleteFeedWithArticles,
  getFeedStats,
  updateFeedCategories,
} from "@/lib/services/feed-service";
import { updateFeedSchema } from "@/lib/validations/feed-validation";
import { createHandler } from "@/lib/api-handler";

export const dynamic = "force-dynamic";

/**
 * GET /api/feeds/:id
 * Get a single feed with statistics
 */
export const GET = createHandler(async ({ params }) => {
  const { id } = params;

  const [feed, stats] = await Promise.all([
    getFeed(id),
    getFeedStats(id),
  ]);

  if (!feed) {
    throw new Error("Feed not found");
  }

  return {
    feed,
    stats,
  };
});

/**
 * PATCH /api/feeds/:id
 * Update a feed
 */
export const PATCH = createHandler(
  async ({ params, body }) => {
    const { id } = params;
    const { categoryIds, ...updateData } = body;

    // Update feed
    const feed = await updateFeed(id, updateData);

    // Update categories if provided
    if (categoryIds !== undefined) {
      await updateFeedCategories(id, categoryIds);
    }

    return { feed };
  },
  { bodySchema: updateFeedSchema, requireUserOrAbove: true }
);

/**
 * DELETE /api/feeds/:id
 * Delete a feed and all its articles
 */
export const DELETE = createHandler(async ({ params }) => {
  const { id } = params;

  // Check if feed exists
  const feed = await getFeed(id);
  if (!feed) {
    throw new Error("Feed not found");
  }

  // Delete feed and articles
  await deleteFeedWithArticles(id);

  return { success: true };
});


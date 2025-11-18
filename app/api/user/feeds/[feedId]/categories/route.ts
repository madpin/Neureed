import { createHandler } from "@/src/lib/api-handler";
import { unassignFeedFromAllCategories } from "@/src/lib/services/user-category-service";

/**
 * DELETE /api/user/feeds/:feedId/categories
 * Remove a feed from all categories (make it uncategorized)
 */
export const DELETE = createHandler(
  async ({ params, session }) => {
    const { feedId } = params;

    await unassignFeedFromAllCategories(session!.user!.id, feedId as string);

    return {
      message: "Feed removed from all categories successfully",
    };
  },
  { requireAuth: true }
);


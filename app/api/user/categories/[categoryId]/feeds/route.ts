import { createHandler } from "@/src/lib/api-handler";
import { z } from "zod";
import {
  assignFeedToCategory,
  unassignFeedFromCategory,
  getCategoryFeeds,
} from "@/src/lib/services/user-category-service";

/**
 * GET /api/user/categories/:categoryId/feeds
 * Get feeds in a category
 */
export const GET = createHandler(
  async ({ params, session }) => {
    const { categoryId } = params;

    const categoryWithFeeds = await getCategoryFeeds(
      session!.user!.id,
      categoryId
    );

    if (!categoryWithFeeds) {
      return {
        error: "Category not found",
        status: 404,
      };
    }

    return categoryWithFeeds;
  },
  { requireAuth: true }
);

const assignFeedSchema = z.object({
  userFeedId: z.string(),
});

/**
 * POST /api/user/categories/:categoryId/feeds
 * Assign a feed to a category
 */
export const POST = createHandler(
  async ({ params, body, session }) => {
    const { categoryId } = params;
    const { userFeedId } = body;

    const assignment = await assignFeedToCategory(
      session!.user!.id,
      userFeedId,
      categoryId
    );

    return {
      assignment,
      message: "Feed assigned to category successfully",
    };
  },
  { bodySchema: assignFeedSchema, requireAuth: true }
);

const unassignFeedSchema = z.object({
  userFeedId: z.string(),
});

/**
 * DELETE /api/user/categories/:categoryId/feeds
 * Unassign a feed from a category
 */
export const DELETE = createHandler(
  async ({ params, body, session }) => {
    const { categoryId } = params;
    const { userFeedId } = body;

    await unassignFeedFromCategory(session!.user!.id, userFeedId, categoryId);

    return {
      message: "Feed unassigned from category successfully",
    };
  },
  { bodySchema: unassignFeedSchema, requireAuth: true }
);


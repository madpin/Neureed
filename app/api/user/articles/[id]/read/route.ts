import { markAsRead, markAsUnread } from "@/lib/services/read-status-service";
import { createHandler } from "@/lib/api-handler";

export const dynamic = "force-dynamic";

/**
 * POST /api/user/articles/:id/read
 * Mark an article as read
 */
export const POST = createHandler(
  async ({ params, session }) => {
    const { id: articleId } = params;

    if (!articleId) {
      return { error: "Article ID is required", status: 400 };
    }

    const readArticle = await markAsRead(session!.user!.id, articleId);

    return {
      readArticle,
      message: "Article marked as read",
    };
  },
  { requireAuth: true }
);

/**
 * DELETE /api/user/articles/:id/read
 * Mark an article as unread
 */
export const DELETE = createHandler(
  async ({ params, session }) => {
    const { id: articleId } = params;

    if (!articleId) {
      return { error: "Article ID is required", status: 400 };
    }

    await markAsUnread(session!.user!.id, articleId);

    return { message: "Article marked as unread" };
  },
  { requireAuth: true }
);


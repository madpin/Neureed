import { markAsRead, markAsUnread } from "@/src/lib/services/read-status-service";
import { createHandler } from "@/src/lib/api-handler";

/**
 * POST /api/user/articles/:id/read
 * Mark an article as read
 */
export const POST = createHandler(
  async ({ params, session }) => {
    const { id: articleId } = params;
    
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
    
    await markAsUnread(session!.user!.id, articleId);

    return { message: "Article marked as unread" };
  },
  { requireAuth: true }
);


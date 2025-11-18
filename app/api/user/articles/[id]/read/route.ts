import { NextRequest } from "next/server";
import { apiResponse, apiError } from "@/src/lib/api-response";
import { withAuth } from "@/src/lib/middleware/auth-middleware";
import { markAsRead, markAsUnread } from "@/src/lib/services/read-status-service";

/**
 * POST /api/user/articles/:id/read
 * Mark an article as read
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(async (user) => {
    try {
      const { id: articleId } = await params;
      
      const readArticle = await markAsRead(user.id, articleId);

      return apiResponse({
        readArticle,
        message: "Article marked as read",
      });
    } catch (error) {
      console.error("Error marking article as read:", error);
      return apiError(
        "Failed to mark article as read",
        500,
        error instanceof Error ? error.message : undefined
      );
    }
  });
}

/**
 * DELETE /api/user/articles/:id/read
 * Mark an article as unread
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(async (user) => {
    try {
      const { id: articleId } = await params;
      
      await markAsUnread(user.id, articleId);

      return apiResponse({
        message: "Article marked as unread",
      });
    } catch (error) {
      console.error("Error marking article as unread:", error);
      return apiError(
        "Failed to mark article as unread",
        500,
        error instanceof Error ? error.message : undefined
      );
    }
  });
}


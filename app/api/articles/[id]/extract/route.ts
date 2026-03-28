import { createHandler } from "@/lib/api-handler";
import { errorResponse, successResponse } from "@/lib/api-response";
import { retryArticleContentExtraction } from "@/lib/services/article-extraction-retry-service";

export const dynamic = "force-dynamic";

/**
 * POST /api/articles/:id/extract
 * Re-run server-side full article extraction (subscriber only).
 */
export const POST = createHandler(
  async ({ params, session }) => {
    const id = params.id;
    if (!id) {
      return errorResponse("Article ID is required", 400);
    }

    const userId = session!.user!.id;
    const result = await retryArticleContentExtraction(id, userId);

    if (!result.ok) {
      return errorResponse(result.error, result.status ?? 500);
    }

    return successResponse({ articleId: result.articleId });
  },
  { requireAuth: true }
);

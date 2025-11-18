import { recordArticleView } from "@/src/lib/services/feedback-service";
import { createHandler } from "@/src/lib/api-handler";

/**
 * POST /api/user/articles/[id]/view
 * Track when user opens an article
 */
export const POST = createHandler(
  async ({ params, session }) => {
    const { id: articleId } = params;

    const viewData = await recordArticleView(session!.user!.id, articleId);

    return {
      viewedAt: viewData.viewedAt,
      estimatedTime: viewData.estimatedTime,
    };
  },
  { requireAuth: true }
);


/**
 * Article Summary API
 * GET /api/articles/[id]/summary - Get article summary
 */

import { summarizeArticle } from "@/src/lib/services/summarization-service";
import { getCurrentUser } from "@/src/lib/middleware/auth-middleware";
import { createHandler } from "@/src/lib/api-handler";

/**
 * GET /api/articles/[id]/summary
 * Get article summary
 */
export const GET = createHandler(async ({ params }) => {
  const { id: articleId } = params;

  const user = await getCurrentUser();
  const summary = await summarizeArticle(articleId, {
    userId: user?.id,
  });

  return { summary };
});


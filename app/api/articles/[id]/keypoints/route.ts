/**
 * Article Key Points API
 * GET /api/articles/[id]/keypoints - Get article key points
 */

import { extractKeyPoints } from "@/lib/services/summarization-service";
import { getCurrentUser } from "@/lib/middleware/auth-middleware";
import { createHandler } from "@/lib/api-handler";

/**
 * GET /api/articles/[id]/keypoints
 * Get article key points
 */
export const GET = createHandler(async ({ params, request }) => {
  const { id: articleId } = params;
  const { searchParams } = new URL(request.url);
  const count = parseInt(searchParams.get("count") || "5");

  const user = await getCurrentUser();
  const keyPoints = await extractKeyPoints(articleId, count, {
    userId: user?.id,
  });

  return { keyPoints };
});


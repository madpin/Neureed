import { scoreArticleBatch } from "@/src/lib/services/article-scoring-service";
import { createHandler } from "@/src/lib/api-handler";
import { z } from "zod";

const scoresSchema = z.object({
  articleIds: z.array(z.string()),
});

/**
 * POST /api/user/articles/scores
 * Get relevance scores for multiple articles
 */
export const POST = createHandler(
  async ({ body, session }) => {
    const { articleIds } = body;

    // Get scores for all articles
    const scoresMap = await scoreArticleBatch(session!.user!.id, articleIds);

    // Convert map to array for JSON response
    const scores = Array.from(scoresMap.values());

    return { scores };
  },
  { bodySchema: scoresSchema, requireAuth: true }
);


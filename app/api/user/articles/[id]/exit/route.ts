import { recordArticleExit } from "@/src/lib/services/feedback-service";
import { updateUserPatterns } from "@/src/lib/services/pattern-detection-service";
import { createHandler } from "@/src/lib/api-handler";
import { z } from "zod";

const exitSchema = z.object({
  timeSpent: z.number().min(0),
  estimatedTime: z.number().positive(),
});

/**
 * POST /api/user/articles/[id]/exit
 * Track when user exits an article and detect bounce
 */
export const POST = createHandler(
  async ({ params, body, session }) => {
    const { id: articleId } = params;
    const { timeSpent, estimatedTime } = body;

    // Record exit and check for bounce
    const feedback = await recordArticleExit(
      session!.user!.id,
      articleId,
      timeSpent,
      estimatedTime
    );

    // If bounce was detected, update patterns
    if (feedback && feedback.feedbackType === "implicit") {
      await updateUserPatterns(
        session!.user!.id,
        articleId,
        feedback.feedbackValue
      );
    }

    return {
      feedback: feedback || null,
      isBounce: feedback !== null,
    };
  },
  { bodySchema: exitSchema, requireAuth: true }
);


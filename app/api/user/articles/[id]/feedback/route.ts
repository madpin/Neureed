import {
  recordExplicitFeedback,
  getUserFeedbackForArticle,
  deleteFeedback,
  type ExplicitFeedbackValue,
} from "@/src/lib/services/feedback-service";
import { updateUserPatterns } from "@/src/lib/services/pattern-detection-service";
import { createHandler } from "@/src/lib/api-handler";
import { z } from "zod";

/**
 * GET /api/user/articles/[id]/feedback
 * Get user's feedback for an article
 */
export const GET = createHandler(
  async ({ params, session }) => {
    const { id: articleId } = params;

    const feedback = await getUserFeedbackForArticle(
      session!.user!.id,
      articleId
    );

    return { feedback: feedback || null };
  },
  { requireAuth: true }
);

const feedbackSchema = z.object({
  feedbackValue: z.union([z.literal(1.0), z.literal(-1.0)]),
});

/**
 * POST /api/user/articles/[id]/feedback
 * Submit explicit feedback (thumbs up/down)
 */
export const POST = createHandler(
  async ({ params, body, session }) => {
    const { id: articleId } = params;
    const { feedbackValue } = body;

    // Record feedback
    const feedback = await recordExplicitFeedback(
      session!.user!.id,
      articleId,
      feedbackValue as ExplicitFeedbackValue
    );

    // Update user patterns in real-time
    await updateUserPatterns(session!.user!.id, articleId, feedbackValue);

    return {
      feedback,
      message: "Feedback recorded successfully",
    };
  },
  { bodySchema: feedbackSchema, requireAuth: true }
);

/**
 * DELETE /api/user/articles/[id]/feedback
 * Delete feedback for an article
 */
export const DELETE = createHandler(
  async ({ params, session }) => {
    const { id: articleId } = params;

    await deleteFeedback(session!.user!.id, articleId);

    return { message: "Feedback deleted successfully" };
  },
  { requireAuth: true }
);


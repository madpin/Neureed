import { NextRequest } from "next/server";
import { auth } from "@/src/lib/auth";
import {
  recordExplicitFeedback,
  getUserFeedbackForArticle,
  deleteFeedback,
  type ExplicitFeedbackValue,
} from "@/src/lib/services/feedback-service";
import { updateUserPatterns } from "@/src/lib/services/pattern-detection-service";
import { apiResponse, apiError } from "@/src/lib/api-response";

/**
 * GET /api/user/articles/[id]/feedback
 * Get user's feedback for an article
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return apiError("Unauthorized", 401);
    }

    const { id: articleId } = await params;

    const feedback = await getUserFeedbackForArticle(
      session.user.id,
      articleId
    );

    return apiResponse({
      feedback: feedback || null,
    });
  } catch (error) {
    console.error("Error fetching feedback:", error);
    return apiError("Failed to fetch feedback");
  }
}

/**
 * POST /api/user/articles/[id]/feedback
 * Submit explicit feedback (thumbs up/down)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return apiError("Unauthorized", 401);
    }

    const { id: articleId } = await params;
    const body = await request.json();
    const { feedbackValue } = body;

    // Validate feedback value
    if (feedbackValue !== 1.0 && feedbackValue !== -1.0) {
      return apiError("Invalid feedback value. Must be 1.0 or -1.0", 400);
    }

    // Record feedback
    const feedback = await recordExplicitFeedback(
      session.user.id,
      articleId,
      feedbackValue as ExplicitFeedbackValue
    );

    // Update user patterns in real-time
    await updateUserPatterns(session.user.id, articleId, feedbackValue);

    return apiResponse({
      feedback,
      message: "Feedback recorded successfully",
    });
  } catch (error) {
    console.error("Error recording feedback:", error);
    return apiError("Failed to record feedback");
  }
}

/**
 * DELETE /api/user/articles/[id]/feedback
 * Delete feedback for an article
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return apiError("Unauthorized", 401);
    }

    const { id: articleId } = await params;

    await deleteFeedback(session.user.id, articleId);

    return apiResponse({
      message: "Feedback deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting feedback:", error);
    return apiError("Failed to delete feedback");
  }
}


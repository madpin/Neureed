import { NextRequest } from "next/server";
import { auth } from "@/src/lib/auth";
import { recordArticleExit } from "@/src/lib/services/feedback-service";
import { updateUserPatterns } from "@/src/lib/services/pattern-detection-service";
import { apiResponse, apiError } from "@/src/lib/api-response";

/**
 * POST /api/user/articles/[id]/exit
 * Track when user exits an article and detect bounce
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
    const { timeSpent, estimatedTime } = body;

    // Validate input
    if (
      typeof timeSpent !== "number" ||
      typeof estimatedTime !== "number" ||
      timeSpent < 0 ||
      estimatedTime <= 0
    ) {
      return apiError("Invalid timeSpent or estimatedTime", 400);
    }

    // Record exit and check for bounce
    const feedback = await recordArticleExit(
      session.user.id,
      articleId,
      timeSpent,
      estimatedTime
    );

    // If bounce was detected, update patterns
    if (feedback && feedback.feedbackType === "implicit") {
      await updateUserPatterns(
        session.user.id,
        articleId,
        feedback.feedbackValue
      );
    }

    return apiResponse({
      feedback: feedback || null,
      isBounce: feedback !== null,
    });
  } catch (error) {
    console.error("Error recording article exit:", error);
    return apiError("Failed to record article exit");
  }
}


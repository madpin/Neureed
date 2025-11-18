import { NextRequest } from "next/server";
import { auth } from "@/src/lib/auth";
import { recordArticleView } from "@/src/lib/services/feedback-service";
import { apiResponse, apiError } from "@/src/lib/api-response";

/**
 * POST /api/user/articles/[id]/view
 * Track when user opens an article
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

    const viewData = await recordArticleView(session.user.id, articleId);

    return apiResponse({
      viewedAt: viewData.viewedAt,
      estimatedTime: viewData.estimatedTime,
    });
  } catch (error) {
    console.error("Error recording article view:", error);
    return apiError("Failed to record article view");
  }
}


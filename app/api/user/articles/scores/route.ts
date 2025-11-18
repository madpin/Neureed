import { NextRequest } from "next/server";
import { auth } from "@/src/lib/auth";
import { scoreArticleBatch } from "@/src/lib/services/article-scoring-service";
import { apiResponse, apiError } from "@/src/lib/api-response";

/**
 * POST /api/user/articles/scores
 * Get relevance scores for multiple articles
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return apiError("Unauthorized", 401);
    }

    const body = await request.json();
    const { articleIds } = body;

    if (!Array.isArray(articleIds)) {
      return apiError("articleIds must be an array", 400);
    }

    // Get scores for all articles
    const scoresMap = await scoreArticleBatch(session.user.id, articleIds);

    // Convert map to array for JSON response
    const scores = Array.from(scoresMap.values());

    return apiResponse({
      scores,
    });
  } catch (error) {
    console.error("Error fetching article scores:", error);
    return apiError("Failed to fetch article scores");
  }
}


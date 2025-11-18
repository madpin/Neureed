import { NextRequest } from "next/server";
import { getArticlesByDateRange } from "@/src/lib/services/article-service";
import { recentArticlesSchema } from "@/src/lib/validations/article-validation";
import { apiResponse, apiError } from "@/src/lib/api-response";

/**
 * GET /api/articles/recent
 * Get recent articles within a time window
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Parse and validate query parameters
    const queryResult = recentArticlesSchema.safeParse({
      limit: searchParams.get("limit"),
      hours: searchParams.get("hours"),
    });

    if (!queryResult.success) {
      return apiError("Invalid query parameters", 400, queryResult.error.errors);
    }

    const { limit, hours } = queryResult.data;

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - hours * 60 * 60 * 1000);

    // Get articles
    const { articles, total } = await getArticlesByDateRange(
      startDate,
      endDate,
      { limit }
    );

    return apiResponse({
      articles,
      total,
      timeRange: {
        start: startDate,
        end: endDate,
        hours,
      },
    });
  } catch (error) {
    console.error("Error fetching recent articles:", error);
    return apiError(
      "Failed to fetch recent articles",
      500,
      error instanceof Error ? error.message : undefined
    );
  }
}


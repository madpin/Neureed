import { NextRequest } from "next/server";
import { searchArticles } from "@/src/lib/services/article-service";
import { searchArticlesSchema } from "@/src/lib/validations/article-validation";
import { apiResponse, apiError } from "@/src/lib/api-response";

/**
 * GET /api/articles/search
 * Search articles by query
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Parse and validate query parameters
    const queryResult = searchArticlesSchema.safeParse({
      q: searchParams.get("q"),
      page: searchParams.get("page"),
      limit: searchParams.get("limit"),
      feedId: searchParams.get("feedId"),
    });

    if (!queryResult.success) {
      return apiError("Invalid query parameters", 400, queryResult.error.errors);
    }

    const { q, page, limit, feedId } = queryResult.data;

    // Search articles
    const { articles, total } = await searchArticles(q, {
      page,
      limit,
      feedId,
    });

    return apiResponse({
      articles,
      query: q,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error searching articles:", error);
    return apiError(
      "Failed to search articles",
      500,
      error instanceof Error ? error.message : undefined
    );
  }
}


/**
 * Search Suggestions API
 * GET /api/articles/suggestions
 */

import { NextRequest, NextResponse } from "next/server";
import { apiResponse, apiError } from "@/src/lib/api-response";
import { getSearchSuggestions } from "@/src/lib/services/semantic-search-service";

/**
 * GET - Get search suggestions
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || "";
    const limit = parseInt(searchParams.get("limit") || "5");

    if (query.length < 2) {
      return apiResponse({ suggestions: [] });
    }

    const suggestions = await getSearchSuggestions(query, limit);

    return apiResponse({
      query,
      suggestions,
      count: suggestions.length,
    });
  } catch (error) {
    return apiError(
      "Failed to get suggestions",
      error instanceof Error ? error.message : String(error),
      { status: 500 }
    );
  }
}


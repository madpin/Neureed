/**
 * Search Suggestions API
 * GET /api/articles/suggestions
 */

import { getSearchSuggestions } from "@/src/lib/services/semantic-search-service";
import { createHandler } from "@/src/lib/api-handler";
import { apiResponse } from "@/src/lib/api-response";

/**
 * GET - Get search suggestions
 */
export const GET = createHandler(async ({ request }) => {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") || "";
  const limit = parseInt(searchParams.get("limit") || "5");

  if (query.length < 2) {
    return apiResponse({ suggestions: [] });
  }

  const suggestions = await getSearchSuggestions(query, limit);

  return {
    query,
    suggestions,
    count: suggestions.length,
  };
});


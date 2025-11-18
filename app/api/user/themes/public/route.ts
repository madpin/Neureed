/**
 * Public Themes API
 * GET /api/user/themes/public - Get public themes for gallery
 */

import { NextRequest } from "next/server";
import { apiResponse, apiError } from "@/src/lib/api-response";
import { getPublicThemes } from "@/src/lib/services/theme-service";

/**
 * GET /api/user/themes/public
 * Get public themes
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50");

    const themes = await getPublicThemes(limit);

    return apiResponse({ themes });
  } catch (error) {
    console.error("Error fetching public themes:", error);
    return apiError(
      error instanceof Error ? error.message : "Failed to fetch public themes",
      500
    );
  }
}


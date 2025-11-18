/**
 * Theme Activation API
 * POST /api/user/themes/[id]/activate - Activate theme
 */

import { NextRequest } from "next/server";
import { auth } from "@/src/lib/auth";
import { apiResponse, apiError } from "@/src/lib/api-response";
import { activateTheme } from "@/src/lib/services/theme-service";

/**
 * POST /api/user/themes/[id]/activate
 * Activate theme
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return apiError("Unauthorized", 401);
    }

    const userId = session.user.id!;
    const { id: themeId } = await params;

    const theme = await activateTheme(themeId, userId);

    return apiResponse({ theme });
  } catch (error) {
    console.error("Error activating theme:", error);
    return apiError(
      error instanceof Error ? error.message : "Failed to activate theme",
      500
    );
  }
}


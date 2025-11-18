/**
 * Theme Clone API
 * POST /api/user/themes/clone - Clone a public theme
 */

import { NextRequest } from "next/server";
import { auth } from "@/src/lib/auth";
import { apiResponse, apiError } from "@/src/lib/api-response";
import { cloneTheme } from "@/src/lib/services/theme-service";
import { z } from "zod";

const cloneThemeSchema = z.object({
  themeId: z.string(),
  newName: z.string().min(1).max(100).optional(),
});

/**
 * POST /api/user/themes/clone
 * Clone a theme
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return apiError("Unauthorized", 401);
    }

    const userId = session.user.id!;
    const body = await request.json();

    // Validate input
    const validation = cloneThemeSchema.safeParse(body);
    if (!validation.success) {
      return apiError(
        `Invalid input: ${validation.error.errors.map((e) => e.message).join(", ")}`,
        400
      );
    }

    const { themeId, newName } = validation.data;

    const theme = await cloneTheme(themeId, userId, newName);

    return apiResponse({ theme }, 201);
  } catch (error) {
    console.error("Error cloning theme:", error);
    return apiError(
      error instanceof Error ? error.message : "Failed to clone theme",
      500
    );
  }
}


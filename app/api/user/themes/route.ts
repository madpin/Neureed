/**
 * User Themes API
 * GET /api/user/themes - Get user's themes
 * POST /api/user/themes - Create new theme
 */

import { NextRequest } from "next/server";
import { auth } from "@/src/lib/auth";
import { apiResponse, apiError } from "@/src/lib/api-response";
import {
  getUserThemes,
  createTheme,
  initializePresetThemes,
  getActiveTheme,
} from "@/src/lib/services/theme-service";
import { z } from "zod";

const createThemeSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  css: z.string().min(1).max(500000),
  isPublic: z.boolean().optional(),
});

/**
 * GET /api/user/themes
 * Get user's themes
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return apiError("Unauthorized", 401);
    }

    const userId = session.user.id!;

    // Initialize preset themes if this is first time
    await initializePresetThemes(userId);

    // Filter out DB duplicates of Light/Dark (built-in only)
    const allThemes = await getUserThemes(userId);
    const themes = allThemes.filter(
      (t) => !(t.isPreset && (t.name === "Light" || t.name === "Dark"))
    );
    const activeTheme = await getActiveTheme(userId);

    return apiResponse({
      themes,
      activeTheme,
    });
  } catch (error) {
    console.error("Error fetching themes:", error);
    return apiError(
      error instanceof Error ? error.message : "Failed to fetch themes",
      500
    );
  }
}

/**
 * POST /api/user/themes
 * Create new theme
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
    const validation = createThemeSchema.safeParse(body);
    if (!validation.success) {
      return apiError(
        `Invalid input: ${validation.error.errors.map((e) => e.message).join(", ")}`,
        400
      );
    }

    const { name, description, css, isPublic } = validation.data;

    const theme = await createTheme({
      userId,
      name,
      description,
      css,
      isPublic,
    });

    return apiResponse({ theme }, 201);
  } catch (error) {
    console.error("Error creating theme:", error);
    return apiError(
      error instanceof Error ? error.message : "Failed to create theme",
      500
    );
  }
}


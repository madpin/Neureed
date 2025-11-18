/**
 * User Theme API (Single)
 * GET /api/user/themes/[id] - Get theme by ID
 * PUT /api/user/themes/[id] - Update theme
 * DELETE /api/user/themes/[id] - Delete theme
 * POST /api/user/themes/[id]/activate - Activate theme
 */

import { NextRequest } from "next/server";
import { auth } from "@/src/lib/auth";
import { apiResponse, apiError } from "@/src/lib/api-response";
import {
  getTheme,
  updateTheme,
  deleteTheme,
  activateTheme,
} from "@/src/lib/services/theme-service";
import { z } from "zod";

const updateThemeSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  css: z.string().min(1).max(500000).optional(),
  isActive: z.boolean().optional(),
  isPublic: z.boolean().optional(),
});

/**
 * GET /api/user/themes/[id]
 * Get theme by ID
 */
export async function GET(
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

    const theme = await getTheme(themeId, userId);

    if (!theme) {
      return apiError("Theme not found", 404);
    }

    return apiResponse({ theme });
  } catch (error) {
    console.error("Error fetching theme:", error);
    return apiError(
      error instanceof Error ? error.message : "Failed to fetch theme",
      500
    );
  }
}

/**
 * PUT /api/user/themes/[id]
 * Update theme
 */
export async function PUT(
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
    const body = await request.json();

    // Validate input
    const validation = updateThemeSchema.safeParse(body);
    if (!validation.success) {
      return apiError(
        `Invalid input: ${validation.error.errors.map((e) => e.message).join(", ")}`,
        400
      );
    }

    const theme = await updateTheme(themeId, userId, validation.data);

    return apiResponse({ theme });
  } catch (error) {
    console.error("Error updating theme:", error);
    return apiError(
      error instanceof Error ? error.message : "Failed to update theme",
      500
    );
  }
}

/**
 * DELETE /api/user/themes/[id]
 * Delete theme
 */
export async function DELETE(
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

    await deleteTheme(themeId, userId);

    return apiResponse({ success: true });
  } catch (error) {
    console.error("Error deleting theme:", error);
    return apiError(
      error instanceof Error ? error.message : "Failed to delete theme",
      500
    );
  }
}


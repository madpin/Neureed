import { NextRequest, NextResponse } from "next/server";
import {
  getExtractionSettings,
  updateExtractionSettings,
  clearExtractionSettings,
} from "@/src/lib/services/feed-settings-service";
import { updateExtractionSettingsSchema } from "@/src/lib/validations/extraction-validation";
import { apiResponse, apiError } from "@/src/lib/api-response";
import { logger } from "@/src/lib/logger";
import type { ExtractionSettings } from "@/src/lib/extractors/types";

/**
 * GET /api/feeds/[id]/settings
 * Get extraction settings for a feed
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    logger.info(`[API] Getting extraction settings for feed ${id}`);

    const settings = await getExtractionSettings(id);

    if (!settings) {
      return apiResponse({ settings: null });
    }

    return apiResponse({ settings });
  } catch (error) {
    logger.error(`[API] Failed to get extraction settings: ${error}`);
    return apiError(
      error instanceof Error ? error.message : "Failed to get extraction settings",
      500
    );
  }
}

/**
 * PUT /api/feeds/[id]/settings
 * Update extraction settings for a feed
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    logger.info(`[API] Updating extraction settings for feed ${id}`);

    // Validate request body
    const validation = updateExtractionSettingsSchema.safeParse(body);
    if (!validation.success) {
      return apiError(
        `Validation error: ${validation.error.errors.map((e) => e.message).join(", ")}`,
        400
      );
    }

    const updates = validation.data as Partial<ExtractionSettings> & { cookies?: string };

    // Update settings
    const settings = await updateExtractionSettings(id, updates);

    return apiResponse({ settings }, 200);
  } catch (error) {
    logger.error(`[API] Failed to update extraction settings: ${error}`);
    return apiError(
      error instanceof Error ? error.message : "Failed to update extraction settings",
      500
    );
  }
}

/**
 * DELETE /api/feeds/[id]/settings
 * Clear extraction settings for a feed
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    logger.info(`[API] Clearing extraction settings for feed ${id}`);

    await clearExtractionSettings(id);

    return apiResponse({ message: "Extraction settings cleared" }, 200);
  } catch (error) {
    logger.error(`[API] Failed to clear extraction settings: ${error}`);
    return apiError(
      error instanceof Error ? error.message : "Failed to clear extraction settings",
      500
    );
  }
}


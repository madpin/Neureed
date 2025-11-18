import {
  getExtractionSettings,
  updateExtractionSettings,
  clearExtractionSettings,
} from "@/src/lib/services/feed-settings-service";
import { updateExtractionSettingsSchema } from "@/src/lib/validations/extraction-validation";
import { createHandler } from "@/src/lib/api-handler";
import { logger } from "@/src/lib/logger";
import type { ExtractionSettings } from "@/src/lib/extractors/types";

/**
 * GET /api/feeds/[id]/settings
 * Get extraction settings for a feed
 */
export const GET = createHandler(async ({ params }) => {
  const { id } = params;
  
  logger.info(`[API] Getting extraction settings for feed ${id}`);

  const settings = await getExtractionSettings(id);

  return { settings: settings || null };
});

/**
 * PUT /api/feeds/[id]/settings
 * Update extraction settings for a feed
 */
export const PUT = createHandler(
  async ({ params, body }) => {
    const { id } = params;

    logger.info(`[API] Updating extraction settings for feed ${id}`);

    const updates = body as Partial<ExtractionSettings> & { cookies?: string };

    // Update settings
    const settings = await updateExtractionSettings(id, updates);

    return { settings };
  },
  { bodySchema: updateExtractionSettingsSchema }
);

/**
 * DELETE /api/feeds/[id]/settings
 * Clear extraction settings for a feed
 */
export const DELETE = createHandler(async ({ params }) => {
  const { id } = params;
  
  logger.info(`[API] Clearing extraction settings for feed ${id}`);

  await clearExtractionSettings(id);

  return { message: "Extraction settings cleared" };
});


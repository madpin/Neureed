/**
 * Default User Preferences API
 * GET/PUT /api/admin/settings/defaults
 * Manage default values for new user preferences
 */

import { createHandler } from "@/lib/api-handler";
import { logger } from "@/lib/logger";
import {
  getDefaultUserPreferences,
  updateDefaultUserPreferences,
} from "@/lib/services/admin-settings-service";
import { defaultUserPreferencesSchema } from "@/lib/validations/admin-validation";

export const dynamic = "force-dynamic";

/**
 * GET - Get default user preferences
 */
export const GET = createHandler(
  async () => {
    const defaults = await getDefaultUserPreferences();

    return {
      defaults,
      message: "Default user preferences retrieved successfully",
    };
  },
  { requireAuth: true }
);

/**
 * PUT - Update default user preferences
 */
export const PUT = createHandler(
  async ({ body }) => {
    logger.info("Updating default user preferences", body);

    try {
      await updateDefaultUserPreferences(body);

      // Get updated defaults
      const defaults = await getDefaultUserPreferences();

      return {
        defaults,
        message: "Default user preferences updated successfully",
      };
    } catch (error) {
      logger.error("Failed to update default user preferences", { error, body });
      throw error;
    }
  },
  { bodySchema: defaultUserPreferencesSchema, requireAuth: true }
);


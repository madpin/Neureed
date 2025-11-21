/**
 * Provider Control API
 * GET/PUT /api/admin/settings/providers
 * Enable/disable embedding providers system-wide
 */

import { createHandler } from "@/lib/api-handler";
import { logger } from "@/lib/logger";
import {
  getProviderStatus,
  setProviderEnabled,
} from "@/lib/services/admin-settings-service";
import { providerStatusSchema } from "@/lib/validations/admin-validation";

export const dynamic = "force-dynamic";

/**
 * GET - Get provider enable/disable status
 */
export const GET = createHandler(
  async () => {
    const status = await getProviderStatus();

    return {
      providers: status,
      message: "Provider status retrieved successfully",
    };
  },
  { requireAdmin: true }
);

/**
 * PUT - Update provider enable/disable status
 * Updates one or both providers
 */
export const PUT = createHandler(
  async ({ body }) => {
    logger.info("Updating provider status", body);

    // Update each provider if specified
    if (body.openai !== undefined) {
      await setProviderEnabled("openai", body.openai);
    }
    if (body.local !== undefined) {
      await setProviderEnabled("local", body.local);
    }

    // Get updated status
    const status = await getProviderStatus();

    return {
      providers: status,
      message: "Provider status updated successfully",
    };
  },
  { bodySchema: providerStatusSchema, requireAdmin: true }
);


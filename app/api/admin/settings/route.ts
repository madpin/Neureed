/**
 * Admin Settings Overview API
 * GET /api/admin/settings
 * Returns a comprehensive overview of all admin-configurable settings
 */

import { createHandler } from "@/lib/api-handler";
import {
  getSystemLLMCredentials,
  getProviderStatus,
  getUserConstraints,
  getDefaultUserPreferences,
  getEmbeddingConfiguration,
} from "@/lib/services/admin-settings-service";

export const dynamic = "force-dynamic";

/**
 * GET - Get comprehensive admin settings overview
 */
export const GET = createHandler(
  async () => {
    // Fetch all admin settings
    const [
      systemLLM,
      providers,
      constraints,
      defaults,
      embeddingConfig,
    ] = await Promise.all([
      getSystemLLMCredentials(true),
      getProviderStatus(),
      getUserConstraints(),
      getDefaultUserPreferences(),
      getEmbeddingConfiguration(),
    ]);

    return {
      systemLLM,
      providers,
      constraints,
      defaults,
      embeddingConfig,
      message: "Admin settings retrieved successfully",
    };
  },
  { requireAdmin: true }
);

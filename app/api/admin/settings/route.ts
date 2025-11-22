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
  getSummarizationConfiguration,
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
      summarizationConfig,
    ] = await Promise.all([
      getSystemLLMCredentials(true),
      getProviderStatus(),
      getUserConstraints(),
      getDefaultUserPreferences(),
      getEmbeddingConfiguration(),
      getSummarizationConfiguration(),
    ]);

    return {
      systemLLM,
      providers,
      constraints,
      defaults,
      embeddingConfig,
      summarizationConfig,
      message: "Admin settings retrieved successfully",
    };
  },
  { requireAdmin: true }
);

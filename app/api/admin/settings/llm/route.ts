/**
 * System LLM Credentials API
 * GET/PUT /api/admin/settings/llm
 * Manage system-wide LLM credentials that users inherit by default
 */

import { createHandler } from "@/lib/api-handler";
import { logger } from "@/lib/logger";
import {
  getSystemLLMCredentials,
  updateSystemLLMCredentials,
} from "@/lib/services/admin-settings-service";
import { systemLLMCredentialsSchema } from "@/lib/validations/admin-validation";

export const dynamic = "force-dynamic";

/**
 * GET - Get system-wide LLM credentials
 * Returns masked API keys for security
 */
export const GET = createHandler(
  async () => {
    const credentials = await getSystemLLMCredentials(true);

    return {
      credentials,
      message: "System LLM credentials retrieved successfully",
    };
  },
  { requireAuth: true }
);

/**
 * PUT - Update system-wide LLM credentials
 * API keys are encrypted before storage
 */
export const PUT = createHandler(
  async ({ body }) => {
    logger.info("Updating system LLM credentials", {
      provider: body.provider,
      hasApiKey: !!body.apiKey,
      hasBaseUrl: !!body.baseUrl,
      model: body.model,
    });

    await updateSystemLLMCredentials(body);

    // Get updated credentials (masked)
    const credentials = await getSystemLLMCredentials(true);

    return {
      credentials,
      message: "System LLM credentials updated successfully",
    };
  },
  { bodySchema: systemLLMCredentialsSchema, requireAuth: true }
);


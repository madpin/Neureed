/**
 * Admin LLM Configuration API
 * Allows admin to configure system-level LLM settings (base URL, API key, models)
 */

import { createHandler } from "@/lib/api-handler";
import { logger } from "@/lib/logger";
import { z } from "zod";
import {
  getSystemLLMConfig,
  updateSystemLLMConfig,
} from "@/lib/services/admin-llm-config-service";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/llm/config
 * Get current system LLM configuration
 */
export const GET = createHandler(
  async () => {
    const config = await getSystemLLMConfig();

    return {
      config,
      message: "System LLM configuration retrieved successfully",
    };
  },
  { requireAdmin: true }
);

const updateLLMConfigSchema = z.object({
  provider: z.enum(["openai", "ollama"]).optional(),
  apiKey: z.string().nullable().optional(),
  baseUrl: z.string().url().nullable().optional(),
  summaryModel: z.string().nullable().optional(),
  embeddingModel: z.string().nullable().optional(),
  digestModel: z.string().nullable().optional(),
});

/**
 * PUT /api/admin/llm/config
 * Update system LLM configuration
 */
export const PUT = createHandler(
  async ({ body }) => {
    logger.info("Updating system LLM configuration", {
      provider: body.provider,
      hasApiKey: !!body.apiKey,
      baseUrl: body.baseUrl,
    });

    const config = await updateSystemLLMConfig(body);

    return {
      config,
      message: "System LLM configuration updated successfully",
    };
  },
  { bodySchema: updateLLMConfigSchema, requireAdmin: true }
);


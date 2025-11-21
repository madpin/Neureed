/**
 * Admin LLM Configuration Test API
 * Test LLM configuration without saving it
 */

import { createHandler } from "@/lib/api-handler";
import { logger } from "@/lib/logger";
import { z } from "zod";
import { testSystemLLMConfig } from "@/lib/services/admin-llm-config-service";

export const dynamic = "force-dynamic";

const testLLMConfigSchema = z.object({
  provider: z.enum(["openai", "ollama"]).optional(),
  apiKey: z.string().nullable().optional(),
  baseUrl: z.string().url().nullable().optional(),
  summaryModel: z.string().nullable().optional(),
  embeddingModel: z.string().nullable().optional(),
  digestModel: z.string().nullable().optional(),
});

/**
 * POST /api/admin/llm/config/test
 * Test system LLM configuration without saving
 */
export const POST = createHandler(
  async ({ body }) => {
    logger.info("Testing system LLM configuration", {
      provider: body.provider,
      hasApiKey: !!body.apiKey,
      baseUrl: body.baseUrl,
    });

    const results = await testSystemLLMConfig(body);

    if (!results.success) {
      // Return error details but with 200 status so the UI can display them
      return {
        results,
        message: "Configuration test failed",
      };
    }

    return {
      results,
      message: "Configuration test successful",
    };
  },
  { bodySchema: testLLMConfigSchema, requireAdmin: true }
);


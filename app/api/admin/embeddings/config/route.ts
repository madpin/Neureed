/**
 * Embedding Configuration API
 * GET/PATCH /api/admin/embeddings/config
 */

import { createHandler } from "@/lib/api-handler";
import { logger } from "@/lib/logger";
import { z } from "zod";
import {
  getEmbeddingConfig,
  testEmbeddingProvider,
} from "@/lib/services/embedding-service";
import { getEmbeddingConfiguration } from "@/lib/services/admin-settings-service";
import { env } from "@/env";

export const dynamic = "force-dynamic";

/**
 * GET - Get current embedding configuration
 * Tests providers using user's LLM preferences if system key is not available
 */
export const GET = createHandler(
  async ({ session }) => {
    const config = getEmbeddingConfig();
    const embeddingConfig = await getEmbeddingConfiguration();
    const userId = session?.user?.id;

    // Test both providers (with graceful error handling)
    // OpenAI is always "available" - admin enables/disables it, users provide credentials
    // Skip user enabled check for admin testing
    const openaiTest = await testEmbeddingProvider("openai", userId, true).catch((error) => {
      const errorMsg = error instanceof Error ? error.message : String(error);
      const hasSystemKey = !!process.env.OPENAI_API_KEY;
      
      logger.debug("OpenAI provider test", { 
        error: errorMsg,
        userId,
        hasSystemKey,
      });
      
      return {
        success: false,
        provider: "openai",
        dimensions: 0,
        testTime: 0,
        error: hasSystemKey 
          ? "Invalid system API key - users can provide their own" 
          : "No system API key configured - users can provide their own",
        available: true, // Always available for user credentials
      };
    });

    const localTest = await testEmbeddingProvider("local", userId, true).catch((error) => {
      logger.debug("Local provider test failed", { 
        error: error instanceof Error ? error.message : String(error),
        userId,
      });
      return {
        success: false,
        provider: "local",
        dimensions: 0,
        testTime: 0,
        error: "Not available or missing dependencies",
        available: false,
      };
    });

    return {
      config,
      providers: {
        openai: {
          ...openaiTest,
          available: openaiTest.available !== false,
          canUseUserCredentials: true,
        },
        local: {
          ...localTest,
          available: localTest.success,
          canUseUserCredentials: false,
        },
      },
      autoGenerate: embeddingConfig.autoGenerate,
      autoGenerateSource: embeddingConfig.autoGenerateSource,
      envDefault: env.EMBEDDING_AUTO_GENERATE,
      usingUserConfig: userId ? openaiTest.success : false,
      message: "OpenAI always available - admin controls enable/disable, users provide credentials",
    };
  },
  { requireAuth: true }
);

const testProviderSchema = z.object({
  provider: z.enum(["openai", "local"]).optional(),
});

/**
 * POST - Test embedding provider
 * Uses user's LLM preferences if system key is not available
 */
export const POST = createHandler(
  async ({ body, session }) => {
    const { provider } = body;
    const userId = session?.user?.id;

    logger.info("Testing embedding provider", { provider, userId });

    // Skip user enabled check for admin testing
    const result = await testEmbeddingProvider(provider, userId, true);

    return {
      ...result,
      usingUserConfig: userId && result.success,
    };
  },
  { bodySchema: testProviderSchema, requireAuth: true }
);


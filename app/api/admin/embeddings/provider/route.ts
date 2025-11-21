/**
 * Embedding Provider Management API
 * GET/PUT /api/admin/embeddings/provider
 */

import { createHandler } from "@/lib/api-handler";
import { logger } from "@/lib/logger";
import {
  getActiveEmbeddingProvider,
  setActiveEmbeddingProvider,
  getEmbeddingConfiguration,
} from "@/lib/services/admin-settings-service";
import { testEmbeddingProvider } from "@/lib/services/embedding-service";
import { z } from "zod";

export const dynamic = "force-dynamic";

/**
 * GET - Get current embedding provider configuration
 * Tests providers using user's LLM preferences if system key is not available
 */
export const GET = createHandler(
  async ({ session }) => {
    const config = await getEmbeddingConfiguration();
    const activeProvider = await getActiveEmbeddingProvider();
    const userId = session?.user?.id;

    // Test both providers to show their status
    // OpenAI is always "available" - admin enables/disables it, users provide credentials
    // Skip user enabled check for admin testing
    const openaiTest = await testEmbeddingProvider("openai", userId, true).catch((error) => {
      const errorMsg = error instanceof Error ? error.message : String(error);
      const hasSystemKey = !!process.env.OPENAI_API_KEY;
      
      logger.debug("OpenAI provider test", { 
        error: errorMsg,
        userId,
        hasSystemKey,
        hasUserKey: userId ? true : false,
      });
      
      // If no API key at all, show helpful message
      if (errorMsg.includes("API key not configured") || errorMsg.includes("API key")) {
        return {
          success: false,
          provider: "openai",
          dimensions: 0,
          testTime: 0,
          error: hasSystemKey 
            ? "Invalid system API key - users can provide their own" 
            : "No system API key - users can provide their own in preferences",
          available: true, // Still available, just needs user credentials
        };
      }
      
      return {
        success: false,
        provider: "openai",
        dimensions: 0,
        testTime: 0,
        error: errorMsg,
        available: true, // Provider is available, just may need configuration
      };
    });

    const localTest = await testEmbeddingProvider("local", userId, true).catch((error) => {
      logger.debug("Local provider test failed (expected if dependencies missing)", { 
        error: error instanceof Error ? error.message : String(error),
        userId,
      });
      return {
        success: false,
        provider: "local",
        dimensions: 0,
        testTime: 0,
        error: error instanceof Error ? error.message : "Not available or missing dependencies",
        available: false, // Actually not available if dependencies are missing
      };
    });

    return {
      activeProvider,
      providerSource: config.providerSource,
      providers: {
        openai: {
          ...openaiTest,
          // OpenAI is always "available" - admin just enables/disables, users provide credentials
          available: openaiTest.available !== false,
          configuredWithSystemKey: !!process.env.OPENAI_API_KEY,
          canUseUserCredentials: true,
        },
        local: {
          ...localTest,
          // Local is only available if dependencies exist
          available: localTest.success,
          configuredWithSystemKey: false,
          canUseUserCredentials: false,
        },
      },
      config: {
        model: config.model,
        batchSize: config.batchSize,
        autoGenerate: config.autoGenerate,
      },
      usingUserConfig: userId ? openaiTest.success : false,
      message: openaiTest.success 
        ? "OpenAI working with provided credentials" 
        : "OpenAI available - users can provide API keys in preferences",
    };
  },
  { requireAdmin: true }
);

const updateProviderSchema = z.object({
  provider: z.enum(["openai", "local"]),
});

/**
 * PUT - Update the active embedding provider
 * Admin controls enable/disable, not credential validation
 * OpenAI can be enabled even without system credentials (users provide their own)
 */
export const PUT = createHandler(
  async ({ body, session }) => {
    const { provider } = body;
    const userId = session?.user?.id;

    logger.info("Updating embedding provider", { provider, userId });

    // Test the provider (but don't fail if only credentials are missing)
    // Skip user enabled check for admin operations
    const testResult = await testEmbeddingProvider(provider, userId, true);

    // For OpenAI: Allow switching even if test fails due to credentials
    // Admin just enables it - users will provide their own credentials
    if (provider === "openai") {
      // OpenAI can always be enabled - users provide credentials
      await setActiveEmbeddingProvider(provider);

      const message = testResult.success
        ? `Successfully switched to OpenAI provider (working with ${userId ? "user" : "system"} credentials)`
        : `OpenAI provider enabled - users can provide their own API keys in preferences`;

      logger.info("Embedding provider updated", {
        provider,
        success: testResult.success,
        userId,
      });

      return {
        provider,
        testResult: {
          ...testResult,
          available: true, // Always available for user credentials
        },
        message,
      };
    }

    // For Local: Actually test if dependencies are available
    if (provider === "local") {
      if (!testResult.success) {
        throw new Error(
          testResult.error || "Local provider dependencies not available"
        );
      }

      await setActiveEmbeddingProvider(provider);

      logger.info("Embedding provider updated successfully", {
        provider,
        testTime: testResult.testTime,
        dimensions: testResult.dimensions,
      });

      return {
        provider,
        testResult,
        message: `Successfully switched to Local (WASM) provider`,
      };
    }

    throw new Error(`Unknown provider: ${provider}`);
  },
  { bodySchema: updateProviderSchema, requireAdmin: true }
);

/**
 * POST - Test a specific provider without switching
 * Uses user's LLM preferences if system key is not available
 */
export const POST = createHandler(
  async ({ body, session }) => {
    const { provider } = body;
    const userId = session?.user?.id;

    logger.info("Testing embedding provider", { provider, userId });

    // Skip user enabled check for admin testing
    const testResult = await testEmbeddingProvider(provider, userId, true);

    return {
      ...testResult,
      usingUserConfig: userId && testResult.success,
    };
  },
  { bodySchema: updateProviderSchema, requireAdmin: true }
);


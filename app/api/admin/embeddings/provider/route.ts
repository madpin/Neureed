/**
 * Embedding Provider Management API
 * GET/PUT /api/admin/embeddings/provider
 */

import { NextRequest, NextResponse } from "next/server";
import { apiResponse, apiError } from "@/lib/api-response";
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
 */
export async function GET() {
  try {
    const config = await getEmbeddingConfiguration();
    const activeProvider = await getActiveEmbeddingProvider();

    // Test both providers to show their status (with graceful error handling)
    const openaiTest = await testEmbeddingProvider("openai").catch((error) => {
      logger.debug("OpenAI provider test failed (expected if not configured)", { 
        error: error instanceof Error ? error.message : String(error) 
      });
      return {
        success: false,
        provider: "openai",
        dimensions: 0,
        testTime: 0,
        error: error instanceof Error ? error.message : "Not configured or failed",
      };
    });

    const localTest = await testEmbeddingProvider("local").catch((error) => {
      logger.debug("Local provider test failed (expected if dependencies missing)", { 
        error: error instanceof Error ? error.message : String(error) 
      });
      return {
        success: false,
        provider: "local",
        dimensions: 0,
        testTime: 0,
        error: error instanceof Error ? error.message : "Not available or missing dependencies",
      };
    });

    return apiResponse({
      activeProvider,
      providerSource: config.providerSource,
      providers: {
        openai: {
          ...openaiTest,
          available: openaiTest.success,
        },
        local: {
          ...localTest,
          available: localTest.success,
        },
      },
      config: {
        model: config.model,
        batchSize: config.batchSize,
        autoGenerate: config.autoGenerate,
      },
    });
  } catch (error) {
    logger.error("Failed to get embedding provider config", { error });
    return apiError(
      "Failed to get provider config",
      error instanceof Error ? error.message : String(error),
      { status: 500 }
    );
  }
}

const updateProviderSchema = z.object({
  provider: z.enum(["openai", "local"]),
});

/**
 * PUT - Update the active embedding provider
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = updateProviderSchema.parse(body);

    logger.info("Updating embedding provider", { provider: validated.provider });

    // Test the provider before switching
    const testResult = await testEmbeddingProvider(validated.provider);

    if (!testResult.success) {
      return apiError(
        "Provider test failed",
        testResult.error || "Failed to initialize provider",
        { status: 400 }
      );
    }

    // Update the provider setting
    await setActiveEmbeddingProvider(validated.provider);

    logger.info("Embedding provider updated successfully", {
      provider: validated.provider,
      testTime: testResult.testTime,
      dimensions: testResult.dimensions,
    });

    return apiResponse({
      provider: validated.provider,
      testResult,
      message: `Successfully switched to ${validated.provider} provider`,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return apiError("Invalid request", error.errors[0].message, {
        status: 400,
      });
    }

    logger.error("Failed to update embedding provider", { error });
    return apiError(
      "Failed to update provider",
      error instanceof Error ? error.message : String(error),
      { status: 500 }
    );
  }
}

/**
 * POST - Test a specific provider without switching
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = updateProviderSchema.parse(body);

    logger.info("Testing embedding provider", { provider: validated.provider });

    const testResult = await testEmbeddingProvider(validated.provider);

    return apiResponse({
      ...testResult,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return apiError("Invalid request", error.errors[0].message, {
        status: 400,
      });
    }

    logger.error("Failed to test embedding provider", { error });
    return apiError(
      "Failed to test provider",
      error instanceof Error ? error.message : String(error),
      { status: 500 }
    );
  }
}


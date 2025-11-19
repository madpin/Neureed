/**
 * Embedding Configuration API
 * GET/PATCH /api/admin/embeddings/config
 */

import { NextRequest, NextResponse } from "next/server";
import { apiResponse, apiError } from "@/lib/api-response";
import { logger } from "@/lib/logger";
import {


  getEmbeddingConfig,
  testEmbeddingProvider,
} from "@/lib/services/embedding-service";
import { getEmbeddingConfiguration } from "@/lib/services/admin-settings-service";
import { env } from "@/env";

export const dynamic = "force-dynamic";

/**
 * GET - Get current embedding configuration
 */
export async function GET() {
  try {
    const config = getEmbeddingConfig();
    const embeddingConfig = await getEmbeddingConfiguration();

    // Test both providers (with graceful error handling)
    const openaiTest = await testEmbeddingProvider("openai").catch((error) => {
      logger.debug("OpenAI provider test failed (expected if not configured)", { 
        error: error instanceof Error ? error.message : String(error) 
      });
      return {
        success: false,
        provider: "openai",
        dimensions: 0,
        testTime: 0,
        error: "Not configured or failed",
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
        error: "Not available or missing dependencies",
      };
    });

    return apiResponse({
      config,
      providers: {
        openai: openaiTest,
        local: localTest,
      },
      autoGenerate: embeddingConfig.autoGenerate,
      autoGenerateSource: embeddingConfig.autoGenerateSource,
      envDefault: env.EMBEDDING_AUTO_GENERATE,
    });
  } catch (error) {
    logger.error("Failed to get embedding config", { error });
    return apiError(
      "Failed to get config",
      error instanceof Error ? error.message : String(error),
      { status: 500 }
    );
  }
}

/**
 * POST - Test embedding provider
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const provider = body.provider as "openai" | "local" | undefined;

    logger.info("Testing embedding provider", { provider });

    const result = await testEmbeddingProvider(provider);

    return apiResponse(result);
  } catch (error) {
    logger.error("Failed to test provider", { error });
    return apiError(
      "Failed to test provider",
      error instanceof Error ? error.message : String(error),
      { status: 500 }
    );
  }
}


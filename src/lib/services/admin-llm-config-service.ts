/**
 * Admin LLM Configuration Service
 * Manages system-level LLM settings (fallback when users don't provide their own)
 */

import { prisma } from "../db";
import { logger } from "../logger";
import { encrypt, decrypt, maskApiKey } from "../crypto";
import { env } from "@/env";

export interface SystemLLMConfig {
  provider: "openai" | "ollama" | null;
  apiKey: string | null; // Masked for display
  baseUrl: string | null;
  summaryModel: string | null;
  embeddingModel: string | null;
  digestModel: string | null;
  // Indicate what's from database vs environment
  providerSource: "database" | "environment";
  apiKeySource: "database" | "environment" | "none";
  baseUrlSource: "database" | "environment" | "none";
  summaryModelSource: "database" | "environment";
  embeddingModelSource: "database" | "environment";
  digestModelSource: "database" | "environment";
}

/**
 * Get system LLM configuration
 * Returns configuration with database values taking precedence over environment
 */
export async function getSystemLLMConfig(): Promise<SystemLLMConfig> {
  try {
    // Get values from database
    const [
      dbProvider,
      dbApiKey,
      dbBaseUrl,
      dbSummaryModel,
      dbEmbeddingModel,
      dbDigestModel,
    ] = await Promise.all([
      getAdminSetting<string>("system_llm_provider"),
      getAdminSetting<string>("system_llm_api_key"),
      getAdminSetting<string>("system_llm_base_url"),
      getAdminSetting<string>("system_llm_summary_model"),
      getAdminSetting<string>("system_llm_embedding_model"),
      getAdminSetting<string>("system_llm_digest_model"),
    ]);

    // Decrypt and mask API key if present
    let maskedApiKey: string | null = null;
    let apiKeySource: "database" | "environment" | "none" = "none";

    if (dbApiKey) {
      try {
        const decrypted = decrypt(dbApiKey);
        maskedApiKey = decrypted ? maskApiKey(decrypted) : null;
        apiKeySource = "database";
      } catch (error) {
        logger.error("Failed to decrypt system API key", { error });
      }
    } else if (env.OPENAI_API_KEY) {
      maskedApiKey = maskApiKey(env.OPENAI_API_KEY);
      apiKeySource = "environment";
    }

    return {
      provider: (dbProvider as "openai" | "ollama") || env.LLM_PROVIDER,
      apiKey: maskedApiKey,
      baseUrl: dbBaseUrl || env.OPENAI_BASE_URL || null,
      summaryModel: dbSummaryModel || env.LLM_SUMMARY_MODEL,
      embeddingModel: dbEmbeddingModel || env.EMBEDDING_MODEL,
      digestModel: dbDigestModel || env.LLM_DIGEST_MODEL,
      providerSource: dbProvider ? "database" : "environment",
      apiKeySource,
      baseUrlSource: dbBaseUrl
        ? "database"
        : env.OPENAI_BASE_URL
        ? "environment"
        : "none",
      summaryModelSource: dbSummaryModel ? "database" : "environment",
      embeddingModelSource: dbEmbeddingModel ? "database" : "environment",
      digestModelSource: dbDigestModel ? "database" : "environment",
    };
  } catch (error) {
    logger.error("Failed to get system LLM config", { error });
    throw error;
  }
}

/**
 * Update system LLM configuration
 */
export async function updateSystemLLMConfig(config: {
  provider?: "openai" | "ollama";
  apiKey?: string | null;
  baseUrl?: string | null;
  summaryModel?: string | null;
  embeddingModel?: string | null;
  digestModel?: string | null;
}): Promise<SystemLLMConfig> {
  try {
    const updates: Array<Promise<any>> = [];

    // Update provider
    if (config.provider !== undefined) {
      updates.push(
        updateAdminSetting(
          "system_llm_provider",
          config.provider,
          "System LLM provider (openai/ollama)"
        )
      );
    }

    // Update API key (encrypt if provided, clear if null)
    if (config.apiKey !== undefined) {
      if (config.apiKey === null || config.apiKey.trim() === "") {
        updates.push(
          updateAdminSetting(
            "system_llm_api_key",
            null,
            "System OpenAI API key (encrypted)"
          )
        );
      } else if (!config.apiKey.includes("••••")) {
        // Only encrypt if not already masked
        const encrypted = encrypt(config.apiKey);
        updates.push(
          updateAdminSetting(
            "system_llm_api_key",
            encrypted,
            "System OpenAI API key (encrypted)"
          )
        );
      }
    }

    // Update base URL
    if (config.baseUrl !== undefined) {
      updates.push(
        updateAdminSetting(
          "system_llm_base_url",
          config.baseUrl,
          "System LLM base URL (for custom endpoints)"
        )
      );
    }

    // Update summary model
    if (config.summaryModel !== undefined) {
      updates.push(
        updateAdminSetting(
          "system_llm_summary_model",
          config.summaryModel,
          "System model for summarization"
        )
      );
    }

    // Update embedding model
    if (config.embeddingModel !== undefined) {
      updates.push(
        updateAdminSetting(
          "system_llm_embedding_model",
          config.embeddingModel,
          "System model for embeddings"
        )
      );
    }

    // Update digest model
    if (config.digestModel !== undefined) {
      updates.push(
        updateAdminSetting(
          "system_llm_digest_model",
          config.digestModel,
          "System model for digest generation"
        )
      );
    }

    await Promise.all(updates);

    logger.info("System LLM configuration updated", { config });

    return await getSystemLLMConfig();
  } catch (error) {
    logger.error("Failed to update system LLM config", { error });
    throw error;
  }
}

/**
 * Test system LLM configuration
 * Tests both summarization and embedding capabilities
 */
export async function testSystemLLMConfig(testConfig?: {
  provider?: "openai" | "ollama";
  apiKey?: string | null;
  baseUrl?: string | null;
  summaryModel?: string | null;
  embeddingModel?: string | null;
}): Promise<{
  success: boolean;
  embedding?: {
    success: boolean;
    model: string;
    dimensions: number;
    testTime: number;
    error?: string;
  };
  summary?: {
    success: boolean;
    model: string;
    testTime: number;
    error?: string;
  };
  error?: string;
}> {
  try {
    const currentConfig = await getSystemLLMConfig();

    // Use test config if provided, otherwise use current config
    const provider = testConfig?.provider || currentConfig.provider || "openai";
    const baseUrl = testConfig?.baseUrl || currentConfig.baseUrl || undefined;
    const embeddingModel =
      testConfig?.embeddingModel || currentConfig.embeddingModel;
    const summaryModel =
      testConfig?.summaryModel || currentConfig.summaryModel;

    // Get API key (decrypt from database or use test config)
    let apiKey: string | undefined;
    if (testConfig?.apiKey && !testConfig.apiKey.includes("••••")) {
      apiKey = testConfig.apiKey;
    } else {
      const dbApiKey = await getAdminSetting<string>("system_llm_api_key");
      if (dbApiKey) {
        try {
          apiKey = decrypt(dbApiKey) || undefined;
        } catch (error) {
          logger.error("Failed to decrypt API key for test", { error });
        }
      }
    }

    if (!apiKey && provider === "openai") {
      apiKey = env.OPENAI_API_KEY || undefined;
    }

    // Test embedding
    const embeddingResult = await testEmbedding(
      provider,
      apiKey,
      baseUrl,
      embeddingModel
    );

    // Test summarization
    const summaryResult = await testSummary(
      provider,
      apiKey,
      baseUrl,
      summaryModel
    );

    const success = embeddingResult.success && summaryResult.success;

    return {
      success,
      embedding: embeddingResult,
      summary: summaryResult,
    };
  } catch (error) {
    logger.error("System LLM config test failed", { error });
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Test embedding capability
 */
async function testEmbedding(
  provider: string,
  apiKey: string | undefined,
  baseUrl: string | undefined,
  model: string | null
): Promise<{
  success: boolean;
  model: string;
  dimensions: number;
  testTime: number;
  error?: string;
}> {
  const startTime = Date.now();
  const embeddingModel = model || env.EMBEDDING_MODEL;

  try {
    if (provider === "openai") {
      const { OpenAIEmbeddingProvider } = await import(
        "@/lib/embeddings/openai-provider"
      );

      if (!apiKey) {
        throw new Error("OpenAI API key required for testing");
      }

      const embeddingProvider = new OpenAIEmbeddingProvider(
        apiKey,
        embeddingModel,
        baseUrl
      );

      const result = await embeddingProvider.generateEmbedding(
        "Test embedding generation"
      );

      return {
        success: true,
        model: embeddingModel,
        dimensions: result.embedding.length,
        testTime: Date.now() - startTime,
      };
    } else {
      // Local/Ollama embedding test
      const { LocalEmbeddingProvider } = await import(
        "@/lib/embeddings/local-provider"
      );
      const embeddingProvider = new LocalEmbeddingProvider();

      const result = await embeddingProvider.generateEmbedding(
        "Test embedding generation"
      );

      return {
        success: true,
        model: embeddingProvider.getModelName(),
        dimensions: result.embedding.length,
        testTime: Date.now() - startTime,
      };
    }
  } catch (error) {
    return {
      success: false,
      model: embeddingModel,
      dimensions: 0,
      testTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Test summarization capability
 */
async function testSummary(
  provider: string,
  apiKey: string | undefined,
  baseUrl: string | undefined,
  model: string | null
): Promise<{
  success: boolean;
  model: string;
  testTime: number;
  error?: string;
}> {
  const startTime = Date.now();
  const summaryModel = model || env.LLM_SUMMARY_MODEL;

  try {
    if (provider === "openai") {
      if (!apiKey) {
        throw new Error("OpenAI API key required for testing");
      }

      const { OpenAILLMProvider } = await import("@/lib/llm/openai-provider");
      const llmProvider = new OpenAILLMProvider(
        apiKey,
        summaryModel,
        baseUrl || "https://api.openai.com/v1"
      );

      // Simple test completion
      await llmProvider.complete({
        prompt: "Respond with 'OK' if you can read this.",
        maxTokens: 10,
      });

      return {
        success: true,
        model: summaryModel,
        testTime: Date.now() - startTime,
      };
    } else {
      // Ollama test would go here
      return {
        success: false,
        model: summaryModel,
        testTime: Date.now() - startTime,
        error: "Ollama testing not yet implemented",
      };
    }
  } catch (error) {
    return {
      success: false,
      model: summaryModel,
      testTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Helper to get admin setting
 */
async function getAdminSetting<T = any>(key: string): Promise<T | null> {
  try {
    const setting = await prisma.adminSettings.findUnique({
      where: { key },
    });

    return setting?.value as T;
  } catch (error) {
    logger.error("Failed to get admin setting", { key, error });
    return null;
  }
}

/**
 * Helper to update admin setting
 */
async function updateAdminSetting(
  key: string,
  value: any,
  description?: string
): Promise<void> {
  try {
    await prisma.adminSettings.upsert({
      where: { key },
      update: {
        value,
        description: description || undefined,
        updatedAt: new Date(),
      },
      create: {
        key,
        value,
        description,
      },
    });
  } catch (error) {
    logger.error("Failed to update admin setting", { key, error });
    throw error;
  }
}


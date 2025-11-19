/**
 * Embedding Service
 * Provides abstraction layer for different embedding providers
 */

import { env } from "@/env";
import { logger } from "@/lib/logger";
import { OpenAIEmbeddingProvider } from "@/lib/embeddings/openai-provider";
import { LocalEmbeddingProvider } from "@/lib/embeddings/local-provider";
import { trackEmbeddingCost } from "./embedding-cost-tracker";
import { 
  getActiveEmbeddingProvider,
  isProviderEnabled,
  getSystemLLMCredentials,
} from "./admin-settings-service";
import { getUserPreferencesWithDecryptedKey } from "./user-preferences-service";
import type {
  EmbeddingProvider,
  EmbeddingProviderInterface,
  EmbeddingResult,
  BatchEmbeddingResult,
  EmbeddingConfig,
} from "@/lib/embeddings/types";

/**
 * Get the configured embedding provider with fallback
 * If providerType is specified, use that. Otherwise, check user preferences, database, then environment.
 * If userId is provided, use their LLM preferences for API key and configuration.
 * Enforces admin provider enable/disable settings.
 */
export async function getEmbeddingProvider(
  providerType?: EmbeddingProvider,
  userId?: string,
  skipUserEnabledCheck: boolean = false
): Promise<EmbeddingProviderInterface> {
  let provider: EmbeddingProvider;
  let apiKey: string | undefined;
  let baseUrl: string | undefined;
  let model: string | undefined;
  
  // Get user preferences if userId is provided
  if (userId) {
    try {
      const preferences = await getUserPreferencesWithDecryptedKey(userId);
      if (preferences) {
        // Check if user has embeddings enabled (skip for admin/testing operations)
        if (!skipUserEnabledCheck && !preferences.embeddingsEnabled) {
          logger.info("User has embeddings disabled, skipping", { userId });
          throw new Error("Embeddings disabled for user");
        }
        
        // Use user's LLM preferences for embeddings
        if (preferences.llmProvider) {
          provider = preferences.llmProvider === "openai" || preferences.llmProvider === "local" 
            ? preferences.llmProvider as EmbeddingProvider
            : env.EMBEDDING_PROVIDER;
        } else {
          provider = providerType || await getActiveEmbeddingProvider().catch(() => env.EMBEDDING_PROVIDER);
        }
        
        // Use user's API key if they have one
        if (preferences.llmApiKey) {
          apiKey = preferences.llmApiKey;
        }
        
        // Use user's base URL if they have one
        if (preferences.llmBaseUrl) {
          baseUrl = preferences.llmBaseUrl;
        }
        
        // Use user's embedding model if they have one
        if (preferences.llmEmbeddingModel) {
          model = preferences.llmEmbeddingModel;
        }
      }
    } catch (error) {
      if (error instanceof Error && error.message === "Embeddings disabled for user") {
        throw error;
      }
      logger.warn("Failed to get user preferences for embeddings", { error, userId });
    }
  }
  
  // Fall back to system defaults if no user preferences
  if (!provider!) {
    if (providerType) {
      provider = providerType;
    } else {
      // Check database first, fall back to environment
      try {
        provider = await getActiveEmbeddingProvider();
      } catch (error) {
        logger.warn("Failed to get provider from database, using environment", { error });
        provider = env.EMBEDDING_PROVIDER;
      }
    }
  }

  // Check if provider is enabled by admin
  const providerEnabled = await isProviderEnabled(provider);
  if (!providerEnabled) {
    const providerName = provider === "openai" ? "OpenAI" : "Local";
    throw new Error(`${providerName} embeddings have been disabled by the administrator`);
  }

  // If no user credentials, try to use system credentials
  if (!apiKey) {
    const systemCreds = await getSystemLLMCredentials(false);
    if (systemCreds.provider === provider || (!systemCreds.provider && provider === "openai")) {
      apiKey = systemCreds.apiKey || undefined;
      baseUrl = baseUrl || systemCreds.baseUrl || undefined;
      // System credentials don't have embedding model - always use EMBEDDING_MODEL env var
    }
  }

  switch (provider) {
    case "openai":
      try {
        // Use user's API key if available, otherwise use system key
        const finalApiKey = apiKey || env.OPENAI_API_KEY;
        if (!finalApiKey) {
          throw new Error("OpenAI API key not configured. Please configure system credentials or provide your own API key.");
        }
        
        const finalBaseUrl = baseUrl || env.OPENAI_BASE_URL;
        const finalModel = model || env.EMBEDDING_MODEL;
        
        logger.info("Using OpenAI provider", { 
          hasUserKey: !!apiKey,
          hasSystemKey: !!env.OPENAI_API_KEY,
          model: finalModel,
          userId,
        });
        
        return new OpenAIEmbeddingProvider(finalApiKey, finalModel, finalBaseUrl);
      } catch (error) {
        logger.error("Failed to initialize OpenAI provider", { error, userId });
        throw error;
      }
    case "local":
      logger.info("Using local provider", { userId });
      return new LocalEmbeddingProvider();
    default:
      logger.warn(`Unknown provider ${provider}, falling back to local`);
      return new LocalEmbeddingProvider();
  }
}

/**
 * Generate embedding for a single text
 * If userId is provided, uses their LLM preferences
 */
export async function generateEmbedding(
  text: string,
  provider?: EmbeddingProvider,
  userId?: string
): Promise<EmbeddingResult> {
  const embeddingProvider = await getEmbeddingProvider(provider, userId);

  try {
    const result = await embeddingProvider.generateEmbedding(text);
    
    // Track cost
    trackEmbeddingCost(result.model, result.tokens, "single-embedding");
    
    logger.info("Generated embedding", {
      provider: embeddingProvider.getModelName(),
      tokens: result.tokens,
      textLength: text.length,
      userId,
    });
    return result;
  } catch (error) {
    logger.error("Embedding generation failed", { error, provider, userId });
    throw error;
  }
}

/**
 * Generate embeddings for multiple texts in batch
 * If userId is provided, uses their LLM preferences
 */
export async function generateEmbeddings(
  texts: string[],
  provider?: EmbeddingProvider,
  userId?: string
): Promise<BatchEmbeddingResult> {
  if (texts.length === 0) {
    return {
      embeddings: [],
      totalTokens: 0,
      model: provider || env.EMBEDDING_PROVIDER,
    };
  }

  const embeddingProvider = await getEmbeddingProvider(provider, userId);
  const batchSize = env.EMBEDDING_BATCH_SIZE;

  try {
    // Process in configured batch sizes
    const batches: string[][] = [];
    for (let i = 0; i < texts.length; i += batchSize) {
      batches.push(texts.slice(i, i + batchSize));
    }

    const results: BatchEmbeddingResult[] = [];
    for (const batch of batches) {
      const result = await embeddingProvider.generateEmbeddings(batch);
      results.push(result);
    }

    const combined = {
      embeddings: results.flatMap((r) => r.embeddings),
      totalTokens: results.reduce((sum, r) => sum + r.totalTokens, 0),
      model: embeddingProvider.getModelName(),
    };

    // Track cost
    trackEmbeddingCost(combined.model, combined.totalTokens, "batch-embedding");

    logger.info("Generated batch embeddings", {
      provider: embeddingProvider.getModelName(),
      count: texts.length,
      totalTokens: combined.totalTokens,
      userId,
    });

    return combined;
  } catch (error) {
    logger.error("Batch embedding generation failed", {
      error,
      provider,
      count: texts.length,
      userId,
    });
    throw error;
  }
}

/**
 * Estimate tokens for text
 */
export function estimateTokens(text: string): number {
  // Rough approximation: ~4 characters per token
  return Math.ceil(text.length / 4);
}

/**
 * Get current embedding configuration
 */
export function getEmbeddingConfig(): EmbeddingConfig {
  return {
    provider: env.EMBEDDING_PROVIDER,
    model: env.EMBEDDING_MODEL,
    batchSize: env.EMBEDDING_BATCH_SIZE,
    apiKey: env.OPENAI_API_KEY ? "***" : undefined,
  };
}

/**
 * Test embedding provider
 * If userId is provided, tests with user's LLM preferences
 * For admin tests, skipUserEnabledCheck should be true
 */
export async function testEmbeddingProvider(
  provider?: EmbeddingProvider,
  userId?: string,
  skipUserEnabledCheck: boolean = false
): Promise<{
  success: boolean;
  provider: string;
  dimensions: number;
  testTime: number;
  available: boolean;
  error?: string;
}> {
  const startTime = Date.now();
  
  try {
    // Skip user enabled check for admin operations
    const embeddingProvider = await getEmbeddingProvider(provider, userId, skipUserEnabledCheck);
    const testText = "This is a test sentence for embedding generation.";
    const result = await embeddingProvider.generateEmbedding(testText);

    return {
      success: true,
      provider: embeddingProvider.getModelName(),
      dimensions: result.embedding.length,
      testTime: Date.now() - startTime,
      available: true,
    };
  } catch (error) {
    return {
      success: false,
      provider: provider || "unknown",
      dimensions: 0,
      testTime: Date.now() - startTime,
      available: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}


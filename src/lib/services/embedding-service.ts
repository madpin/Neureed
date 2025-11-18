/**
 * Embedding Service
 * Provides abstraction layer for different embedding providers
 */

import { env } from "@/src/env";
import { logger } from "@/src/lib/logger";
import { OpenAIEmbeddingProvider } from "@/src/lib/embeddings/openai-provider";
import { LocalEmbeddingProvider } from "@/src/lib/embeddings/local-provider";
import { trackEmbeddingCost } from "./embedding-cost-tracker";
import type {
  EmbeddingProvider,
  EmbeddingProviderInterface,
  EmbeddingResult,
  BatchEmbeddingResult,
  EmbeddingConfig,
} from "@/src/lib/embeddings/types";

/**
 * Get the configured embedding provider
 */
export function getEmbeddingProvider(
  providerType?: EmbeddingProvider
): EmbeddingProviderInterface {
  const provider = providerType || env.EMBEDDING_PROVIDER;

  switch (provider) {
    case "openai":
      return new OpenAIEmbeddingProvider();
    case "local":
      return new LocalEmbeddingProvider();
    default:
      logger.warn(`Unknown provider ${provider}, falling back to local`);
      return new LocalEmbeddingProvider();
  }
}

/**
 * Generate embedding for a single text
 */
export async function generateEmbedding(
  text: string,
  provider?: EmbeddingProvider
): Promise<EmbeddingResult> {
  const embeddingProvider = getEmbeddingProvider(provider);

  try {
    const result = await embeddingProvider.generateEmbedding(text);
    
    // Track cost
    trackEmbeddingCost(result.model, result.tokens, "single-embedding");
    
    logger.info("Generated embedding", {
      provider: embeddingProvider.getModelName(),
      tokens: result.tokens,
      textLength: text.length,
    });
    return result;
  } catch (error) {
    logger.error("Embedding generation failed", { error, provider });
    throw error;
  }
}

/**
 * Generate embeddings for multiple texts in batch
 */
export async function generateEmbeddings(
  texts: string[],
  provider?: EmbeddingProvider
): Promise<BatchEmbeddingResult> {
  if (texts.length === 0) {
    return {
      embeddings: [],
      totalTokens: 0,
      model: provider || env.EMBEDDING_PROVIDER,
    };
  }

  const embeddingProvider = getEmbeddingProvider(provider);
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
    });

    return combined;
  } catch (error) {
    logger.error("Batch embedding generation failed", {
      error,
      provider,
      count: texts.length,
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
 */
export async function testEmbeddingProvider(
  provider?: EmbeddingProvider
): Promise<{
  success: boolean;
  provider: string;
  dimensions: number;
  testTime: number;
  error?: string;
}> {
  const startTime = Date.now();
  const embeddingProvider = getEmbeddingProvider(provider);

  try {
    const testText = "This is a test sentence for embedding generation.";
    const result = await embeddingProvider.generateEmbedding(testText);

    return {
      success: true,
      provider: embeddingProvider.getModelName(),
      dimensions: result.embedding.length,
      testTime: Date.now() - startTime,
    };
  } catch (error) {
    return {
      success: false,
      provider: embeddingProvider.getModelName(),
      dimensions: 0,
      testTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}


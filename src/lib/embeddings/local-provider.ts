/**
 * Local Embeddings Provider
 * Uses Transformers.js with bge-small-en-v1.5 model
 * Note: This will be implemented when @xenova/transformers is available
 */

import { logger } from "@/lib/logger";
import type {
  EmbeddingProviderInterface,
  EmbeddingResult,
  BatchEmbeddingResult,
} from "./types";

export class LocalEmbeddingProvider implements EmbeddingProviderInterface {
  private model: string;
  private pipeline: any = null;
  private dimensions = 384; // bge-small-en-v1.5 native dimensions

  constructor(model?: string) {
    this.model = model || "Xenova/bge-small-en-v1.5";
  }

  /**
   * Initialize the model pipeline
   */
  private async initializePipeline(): Promise<void> {
    if (this.pipeline) return;

    try {
      logger.info("Initializing local embedding model", { model: this.model });
      
      // Dynamic import to avoid loading if not needed
      const { pipeline } = await import("@xenova/transformers");

      logger.info("Loading local embedding model (this may take a few minutes on first use)", { 
        model: this.model 
      });

      this.pipeline = await pipeline("feature-extraction", this.model, {
        quantized: true, // Use quantized model for better performance
      });

      logger.info("Local embedding model loaded successfully", {
        model: this.model,
        dimensions: this.dimensions
      });
    } catch (error) {
      logger.error("Failed to load local embedding model", { 
        error,
        message: error instanceof Error ? error.message : String(error),
        model: this.model
      });
      throw new Error(
        `Local embedding model not available: ${error instanceof Error ? error.message : String(error)}. Install @xenova/transformers or use OpenAI provider.`
      );
    }
  }

  /**
   * Normalize embedding to 1536 dimensions (pad with zeros)
   */
  private normalizeEmbedding(embedding: number[]): number[] {
    const targetDim = 1536;
    if (embedding.length === targetDim) {
      return embedding;
    }

    if (embedding.length > targetDim) {
      // Truncate if larger
      return embedding.slice(0, targetDim);
    }

    // Pad with zeros if smaller
    return [...embedding, ...new Array(targetDim - embedding.length).fill(0)];
  }

  /**
   * Generate embedding for a single text
   */
  async generateEmbedding(text: string): Promise<EmbeddingResult> {
    await this.initializePipeline();

    try {
      const output = await this.pipeline(text, {
        pooling: "mean",
        normalize: true,
      });

      // Convert tensor to array
      const embedding = Array.from(output.data) as number[];
      const normalizedEmbedding = this.normalizeEmbedding(embedding);

      return {
        embedding: normalizedEmbedding,
        tokens: this.estimateTokens(text),
        model: this.model,
      };
    } catch (error) {
      logger.error("Local embedding generation failed", { error, text });
      throw error;
    }
  }

  /**
   * Generate embeddings for multiple texts in batch
   */
  async generateEmbeddings(texts: string[]): Promise<BatchEmbeddingResult> {
    if (texts.length === 0) {
      return { embeddings: [], totalTokens: 0, model: this.model };
    }

    await this.initializePipeline();

    try {
      const embeddings: number[][] = [];
      let totalTokens = 0;

      // Process in smaller batches to avoid memory issues
      const batchSize = 5;
      for (let i = 0; i < texts.length; i += batchSize) {
        const batch = texts.slice(i, i + batchSize);
        const batchResults = await Promise.all(
          batch.map((text) => this.generateEmbedding(text))
        );

        embeddings.push(...batchResults.map((r) => r.embedding));
        totalTokens += batchResults.reduce((sum, r) => sum + r.tokens, 0);
      }

      return {
        embeddings,
        totalTokens,
        model: this.model,
      };
    } catch (error) {
      logger.error("Local batch embedding generation failed", {
        error,
        count: texts.length,
      });
      throw error;
    }
  }

  /**
   * Get the model name
   */
  getModelName(): string {
    return this.model;
  }

  /**
   * Get embedding dimensions (normalized to 1536)
   */
  getDimensions(): number {
    return 1536;
  }

  /**
   * Estimate tokens for text
   */
  estimateTokens(text: string): number {
    // Rough approximation: ~4 characters per token
    return Math.ceil(text.length / 4);
  }
}


/**
 * OpenAI Embeddings Provider
 * Uses OpenAI's text-embedding-3-small model (1536 dimensions)
 */

import { env } from "@/src/env";
import { logger } from "@/src/lib/logger";
import type {
  EmbeddingProviderInterface,
  EmbeddingResult,
  BatchEmbeddingResult,
} from "./types";

export class OpenAIEmbeddingProvider implements EmbeddingProviderInterface {
  private apiKey: string;
  private model: string;
  private baseUrl: string;
  private apiUrl: string;

  constructor(apiKey?: string, model?: string, baseUrl?: string) {
    this.apiKey = apiKey || env.OPENAI_API_KEY || "";
    this.model = model || env.EMBEDDING_MODEL;
    this.baseUrl = baseUrl || env.OPENAI_BASE_URL || "https://api.openai.com/v1";

    // Construct the full API URL for embeddings
    this.apiUrl = `${this.baseUrl}/embeddings`;

    if (!this.apiKey) {
      throw new Error(
        "OpenAI API key is required. Set OPENAI_API_KEY environment variable."
      );
    }
  }

  /**
   * Generate embedding for a single text
   */
  async generateEmbedding(text: string): Promise<EmbeddingResult> {
    try {
      const response = await fetch(this.apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          input: text,
          model: this.model,
          encoding_format: "float",
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`OpenAI API error: ${response.status} - ${error}`);
      }

      const data = await response.json();

      return {
        embedding: data.data[0].embedding,
        tokens: data.usage.total_tokens,
        model: this.model,
      };
    } catch (error) {
      logger.error("OpenAI embedding generation failed", { error, text });
      throw error;
    }
  }

  /**
   * Generate embeddings for multiple texts in batch
   * OpenAI supports up to 100 texts per request
   */
  async generateEmbeddings(texts: string[]): Promise<BatchEmbeddingResult> {
    if (texts.length === 0) {
      return { embeddings: [], totalTokens: 0, model: this.model };
    }

    // OpenAI allows up to 100 inputs per request
    const maxBatchSize = 100;
    if (texts.length > maxBatchSize) {
      // Process in chunks
      const chunks: string[][] = [];
      for (let i = 0; i < texts.length; i += maxBatchSize) {
        chunks.push(texts.slice(i, i + maxBatchSize));
      }

      const results = await Promise.all(
        chunks.map((chunk) => this.generateEmbeddings(chunk))
      );

      return {
        embeddings: results.flatMap((r) => r.embeddings),
        totalTokens: results.reduce((sum, r) => sum + r.totalTokens, 0),
        model: this.model,
      };
    }

    try {
      const response = await fetch(this.apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          input: texts,
          model: this.model,
          encoding_format: "float",
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`OpenAI API error: ${response.status} - ${error}`);
      }

      const data = await response.json();

      return {
        embeddings: data.data.map((item: { embedding: number[] }) => item.embedding),
        totalTokens: data.usage.total_tokens,
        model: this.model,
      };
    } catch (error) {
      logger.error("OpenAI batch embedding generation failed", {
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
   * Get embedding dimensions
   */
  getDimensions(): number {
    // text-embedding-3-small produces 1536 dimensions
    return 1536;
  }

  /**
   * Estimate tokens for text (rough approximation)
   * OpenAI uses ~4 characters per token on average
   */
  estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }

  /**
   * Calculate cost for embeddings
   * text-embedding-3-small: $0.02 per 1M tokens
   */
  static calculateCost(tokens: number): number {
    const costPerMillionTokens = 0.02;
    return (tokens / 1_000_000) * costPerMillionTokens;
  }
}


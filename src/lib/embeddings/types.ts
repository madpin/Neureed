/**
 * Embedding provider types and interfaces
 */

export type EmbeddingProvider = "openai" | "local";

export interface EmbeddingResult {
  embedding: number[];
  tokens: number;
  model: string;
}

export interface BatchEmbeddingResult {
  embeddings: number[][];
  totalTokens: number;
  model: string;
}

export interface EmbeddingProviderInterface {
  generateEmbedding(text: string): Promise<EmbeddingResult>;
  generateEmbeddings(texts: string[]): Promise<BatchEmbeddingResult>;
  getModelName(): string;
  getDimensions(): number;
  estimateTokens(text: string): number;
}

export interface EmbeddingConfig {
  provider: EmbeddingProvider;
  model: string;
  batchSize: number;
  apiKey?: string;
}


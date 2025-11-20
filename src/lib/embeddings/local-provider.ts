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
      // Verify WASM backend is configured before importing
      const wasmBackend = process.env.TRANSFORMERS_BACKEND === 'wasm' || 
                         process.env.USE_ONNX_WASM === '1';
      
      logger.info("Initializing local embedding model", { 
        model: this.model,
        wasmConfigured: wasmBackend,
        transformersBackend: process.env.TRANSFORMERS_BACKEND,
        onnxProviders: process.env.ONNXRUNTIME_EXECUTION_PROVIDERS,
      });
      
      // Dynamic import to avoid loading if not needed
      const { pipeline, env: transformersEnv } = await import("@xenova/transformers");

      // CRITICAL: Force WASM backend ONLY to avoid native library dependencies
      // Environment variables should already be set, but we enforce them here too
      
      // Explicitly set WASM backend configuration
      if (transformersEnv.backends?.onnx?.wasm) {
        transformersEnv.backends.onnx.wasm.numThreads = 1;
        transformersEnv.backends.onnx.wasm.wasmPaths = undefined; // Use default CDN paths
      }
      
      // Force WASM execution provider only
      if (transformersEnv.backends?.onnx) {
        (transformersEnv.backends.onnx as any).executionProviders = ['wasm'];
      }
      
      // Disable local models, only use remote (HuggingFace)
      transformersEnv.allowLocalModels = false;
      transformersEnv.allowRemoteModels = true;
      
      // Configure caching
      const isBrowser = typeof window !== 'undefined' && typeof document !== 'undefined';
      transformersEnv.useBrowserCache = isBrowser;
      
      // Set cache directory for model downloads in Node.js
      if (!isBrowser && typeof process !== 'undefined' && process.env) {
        transformersEnv.cacheDir = process.env.TRANSFORMERS_CACHE || './.cache/transformers';
      }

      logger.info("Loading local embedding model with WASM backend (this may take a few minutes on first use)", { 
        model: this.model,
        backend: 'wasm-only',
        cacheDir: transformersEnv.cacheDir,
      });

      this.pipeline = await pipeline("feature-extraction", this.model, {
        quantized: true, // Use quantized model for better performance
      });

      logger.info("Local embedding model loaded successfully with WASM backend", {
        model: this.model,
        dimensions: this.dimensions,
        backend: 'wasm',
      });
    } catch (error) {
      // Check if it's a native library dependency issue
      const isDependencyError = error instanceof Error && 
        (error.message.includes("libonnxruntime") || 
         error.message.includes("ERR_DLOPEN_FAILED") ||
         error.message.includes("cannot open shared object") ||
         error.message.includes("Failed to load external module"));
      
      if (isDependencyError) {
        logger.error("Local embedding model failed due to native library issue - WASM backend not properly configured", { 
          error: error instanceof Error ? error.message : String(error),
          model: this.model,
          envVars: {
            TRANSFORMERS_BACKEND: process.env.TRANSFORMERS_BACKEND,
            ONNXRUNTIME_EXECUTION_PROVIDERS: process.env.ONNXRUNTIME_EXECUTION_PROVIDERS,
            USE_ONNX_WASM: process.env.USE_ONNX_WASM,
          },
          hint: "Ensure TRANSFORMERS_BACKEND=wasm is set before Node.js starts, or use OpenAI provider"
        });
      } else {
        logger.error("Failed to load local embedding model", { 
          error,
          message: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
          model: this.model
        });
      }
      
      throw new Error(
        `Local embedding model not available: ${error instanceof Error ? error.message : String(error)}. Use OpenAI provider or ensure WASM backend is configured.`
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
      // Check if it's a dependency error (from initialization)
      const isDependencyError = error instanceof Error && 
        (error.message.includes("Local embedding model not available") ||
         error.message.includes("libonnxruntime") ||
         error.message.includes("ERR_DLOPEN_FAILED"));
      
      if (isDependencyError) {
        logger.debug("Local embedding generation failed (dependencies unavailable)", { 
          error: error instanceof Error ? error.message : String(error)
        });
      } else {
        logger.error("Local embedding generation failed", { error, text });
      }
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


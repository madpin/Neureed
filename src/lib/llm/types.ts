/**
 * LLM Provider Types
 * Common interfaces for LLM providers
 */

/**
 * LLM completion request
 */
export interface LLMCompletionRequest {
  prompt: string;
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
  stopSequences?: string[];
}

/**
 * LLM completion response
 */
export interface LLMCompletionResponse {
  content: string;
  tokens: {
    prompt: number;
    completion: number;
    total: number;
  };
  model: string;
  finishReason: "stop" | "length" | "error";
}

/**
 * Article summary result
 */
export interface ArticleSummary {
  summary: string;
  keyPoints: string[];
  topics: string[];
  sentiment?: "positive" | "neutral" | "negative";
}

/**
 * LLM Provider Interface
 */
export interface LLMProviderInterface {
  /**
   * Generate completion
   */
  complete(request: LLMCompletionRequest): Promise<LLMCompletionResponse>;

  /**
   * Summarize article
   */
  summarizeArticle(
    title: string,
    content: string
  ): Promise<ArticleSummary>;

  /**
   * Extract key points from article
   */
  extractKeyPoints(content: string, count?: number): Promise<string[]>;

  /**
   * Detect topics/tags from article
   */
  detectTopics(title: string, content: string): Promise<string[]>;

  /**
   * Get model name
   */
  getModelName(): string;

  /**
   * Estimate cost for tokens
   */
  estimateCost(tokens: number): number;
}

/**
 * LLM provider configuration
 */
export interface LLMProviderConfig {
  provider: "openai" | "ollama";
  model: string;
  apiKey?: string;
  baseUrl?: string;
  temperature?: number;
  maxTokens?: number;
}


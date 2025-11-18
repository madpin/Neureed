/**
 * Ollama LLM Provider
 * Uses local Ollama instance for text generation
 */

import { env } from "@/src/env";
import { logger } from "../logger";
import type {
  LLMProviderInterface,
  LLMCompletionRequest,
  LLMCompletionResponse,
  ArticleSummary,
} from "./types";

export class OllamaLLMProvider implements LLMProviderInterface {
  private baseUrl: string;
  private model: string;

  constructor(baseUrl?: string, model?: string) {
    this.baseUrl = baseUrl || env.OLLAMA_BASE_URL;
    this.model = model || env.LLM_MODEL;
  }

  /**
   * Generate completion
   */
  async complete(
    request: LLMCompletionRequest
  ): Promise<LLMCompletionResponse> {
    try {
      const prompt = request.systemPrompt
        ? `${request.systemPrompt}\n\n${request.prompt}`
        : request.prompt;

      const response = await fetch(`${this.baseUrl}/api/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: this.model,
          prompt,
          temperature: request.temperature ?? 0.7,
          options: {
            num_predict: request.maxTokens ?? 1000,
            stop: request.stopSequences,
          },
          stream: false,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Ollama API error: ${response.status} - ${error}`);
      }

      const data = await response.json();

      // Estimate tokens (Ollama doesn't always provide exact counts)
      const promptTokens = Math.ceil(prompt.length / 4);
      const completionTokens = Math.ceil(data.response.length / 4);

      return {
        content: data.response,
        tokens: {
          prompt: promptTokens,
          completion: completionTokens,
          total: promptTokens + completionTokens,
        },
        model: data.model || this.model,
        finishReason: data.done ? "stop" : "length",
      };
    } catch (error) {
      logger.error("Ollama completion failed", { error });
      throw error;
    }
  }

  /**
   * Summarize article
   */
  async summarizeArticle(
    title: string,
    content: string
  ): Promise<ArticleSummary> {
    const systemPrompt = `You are a helpful assistant that summarizes articles. 
Provide a concise summary, extract 3-5 key points, identify 3-5 main topics/tags, and determine the sentiment.
Respond in JSON format with keys: summary, keyPoints (array), topics (array), sentiment (positive/neutral/negative).`;

    // Truncate content if too long
    const truncatedContent =
      content.length > 40000 ? content.substring(0, 40000) + "..." : content;

    const prompt = `Title: ${title}\n\nContent: ${truncatedContent}\n\nPlease analyze this article and provide a summary, key points, topics, and sentiment.`;

    try {
      const response = await this.complete({
        prompt,
        systemPrompt,
        temperature: 0.3,
        maxTokens: 1000,
      });

      // Try to parse JSON response
      try {
        const parsed = JSON.parse(response.content);
        return {
          summary: parsed.summary || "",
          keyPoints: Array.isArray(parsed.keyPoints) ? parsed.keyPoints : [],
          topics: Array.isArray(parsed.topics) ? parsed.topics : [],
          sentiment: ["positive", "neutral", "negative"].includes(
            parsed.sentiment
          )
            ? parsed.sentiment
            : "neutral",
        };
      } catch (parseError) {
        // Fallback: extract from text response
        logger.warn("Failed to parse LLM JSON response, using fallback", {
          parseError,
        });

        return {
          summary: response.content.substring(0, 500),
          keyPoints: [],
          topics: [],
          sentiment: "neutral",
        };
      }
    } catch (error) {
      logger.error("Article summarization failed", { error, title });
      throw error;
    }
  }

  /**
   * Extract key points from article
   */
  async extractKeyPoints(content: string, count = 5): Promise<string[]> {
    const systemPrompt = `You are a helpful assistant that extracts key points from articles.
Provide ${count} concise bullet points that capture the main ideas.
Respond with a JSON array of strings.`;

    const truncatedContent =
      content.length > 40000 ? content.substring(0, 40000) + "..." : content;

    const prompt = `Extract ${count} key points from this content:\n\n${truncatedContent}`;

    try {
      const response = await this.complete({
        prompt,
        systemPrompt,
        temperature: 0.3,
        maxTokens: 500,
      });

      try {
        const parsed = JSON.parse(response.content);
        if (Array.isArray(parsed)) {
          return parsed.slice(0, count);
        }
      } catch (parseError) {
        // Fallback: split by newlines and filter
        const lines = response.content
          .split("\n")
          .map((line) => line.trim())
          .filter((line) => line.length > 0 && line.match(/^[-•*\d.]/))
          .map((line) => line.replace(/^[-•*\d.]\s*/, ""))
          .slice(0, count);

        return lines;
      }

      return [];
    } catch (error) {
      logger.error("Key points extraction failed", { error });
      return [];
    }
  }

  /**
   * Detect topics/tags from article
   */
  async detectTopics(title: string, content: string): Promise<string[]> {
    const systemPrompt = `You are a helpful assistant that identifies topics and tags from articles.
Provide 3-5 relevant topics/tags that categorize the article.
Respond with a JSON array of lowercase strings.`;

    const truncatedContent =
      content.length > 20000 ? content.substring(0, 20000) + "..." : content;

    const prompt = `Title: ${title}\n\nContent: ${truncatedContent}\n\nIdentify the main topics/tags for this article.`;

    try {
      const response = await this.complete({
        prompt,
        systemPrompt,
        temperature: 0.3,
        maxTokens: 200,
      });

      try {
        const parsed = JSON.parse(response.content);
        if (Array.isArray(parsed)) {
          return parsed
            .map((topic) => String(topic).toLowerCase().trim())
            .filter((topic) => topic.length > 0)
            .slice(0, 5);
        }
      } catch (parseError) {
        // Fallback: extract comma-separated values
        const topics = response.content
          .split(/[,\n]/)
          .map((topic) => topic.toLowerCase().trim())
          .filter((topic) => topic.length > 0 && topic.length < 30)
          .slice(0, 5);

        return topics;
      }

      return [];
    } catch (error) {
      logger.error("Topic detection failed", { error });
      return [];
    }
  }

  /**
   * Get model name
   */
  getModelName(): string {
    return this.model;
  }

  /**
   * Estimate cost for tokens
   * Ollama is free (local), so return 0
   */
  estimateCost(tokens: number): number {
    return 0;
  }
}


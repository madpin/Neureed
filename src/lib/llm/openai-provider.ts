/**
 * OpenAI LLM Provider
 * Uses OpenAI's GPT models for text generation
 */

import { env } from "@/src/env";
import { logger } from "../logger";
import type {
  LLMProviderInterface,
  LLMCompletionRequest,
  LLMCompletionResponse,
  ArticleSummary,
} from "./types";

export class OpenAILLMProvider implements LLMProviderInterface {
  private apiKey: string;
  private model: string;
  private baseUrl: string;
  private apiUrl: string;

  constructor(apiKey?: string, model?: string, baseUrl?: string) {
    this.apiKey = apiKey || env.OPENAI_API_KEY || "";
    this.model = model || env.LLM_MODEL;
    this.baseUrl = baseUrl || env.OPENAI_BASE_URL || "https://api.openai.com/v1";

    // Construct the full API URL for chat completions
    this.apiUrl = `${this.baseUrl}/chat/completions`;

    if (!this.apiKey) {
      throw new Error(
        "OpenAI API key is required. Set OPENAI_API_KEY environment variable."
      );
    }
  }

  /**
   * Generate completion
   */
  async complete(
    request: LLMCompletionRequest
  ): Promise<LLMCompletionResponse> {
    try {
      const messages: Array<{ role: string; content: string }> = [];

      if (request.systemPrompt) {
        messages.push({
          role: "system",
          content: request.systemPrompt,
        });
      }

      messages.push({
        role: "user",
        content: request.prompt,
      });

      const response = await fetch(this.apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages,
          temperature: request.temperature ?? 0.7,
          max_tokens: request.maxTokens ?? 1000,
          stop: request.stopSequences,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`OpenAI API error: ${response.status} - ${error}`);
      }

      const data = await response.json();
      const choice = data.choices[0];

      return {
        content: choice.message.content,
        tokens: {
          prompt: data.usage.prompt_tokens,
          completion: data.usage.completion_tokens,
          total: data.usage.total_tokens,
        },
        model: data.model,
        finishReason: choice.finish_reason === "stop" ? "stop" : choice.finish_reason === "length" ? "length" : "error",
      };
    } catch (error) {
      logger.error("OpenAI completion failed", { error });
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

    // Truncate content if too long (approximately 10000 tokens = 40000 characters)
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
   * GPT-4o-mini pricing: $0.150 per 1M input tokens, $0.600 per 1M output tokens
   * Using average of $0.375 per 1M tokens for estimation
   */
  estimateCost(tokens: number): number {
    const costPerMillionTokens = 0.375;
    return (tokens / 1_000_000) * costPerMillionTokens;
  }
}


/**
 * Summarization Service
 * Handles article summarization, key points extraction, and topic detection
 */

import { prisma } from "../db";
import { env } from "@/env";
import { logger } from "../logger";
import { OpenAILLMProvider } from "../llm/openai-provider";
import { OllamaLLMProvider } from "../llm/ollama-provider";
import { cacheGetOrSet } from "../cache/cache-service";
import { CacheKeys, CacheTTL } from "../cache/cache-keys";
import {
  type LLMProviderInterface,
  type ArticleSummary,
  type LLMProviderConfig,
} from "../llm/types";
import { getUserPreferencesWithDecryptedKey } from "./user-preferences-service";
import type { user_preferences } from "@prisma/client";
import { trackSummarizationCost } from "./summarization-cost-tracker";

/**
 * Get LLM provider instance
 */
async function getLLMProvider(userId?: string): Promise<LLMProviderInterface> {
  const config = await resolveLLMConfig(userId);

  if (config.provider === "ollama") {
    return new OllamaLLMProvider(config.baseUrl, config.model);
  }

  return new OpenAILLMProvider(config.apiKey, config.model, config.baseUrl);
}

async function resolveLLMConfig(userId?: string): Promise<LLMProviderConfig> {
  const preferences = userId
    ? await safeGetUserPreferences(userId)
    : null;

  const preferredProvider = sanitizeProvider(preferences?.llmProvider);
  const provider = preferredProvider ?? env.LLM_PROVIDER;

  if (provider === "ollama") {
    return {
      provider,
      model: preferences?.llmSummaryModel ?? env.LLM_SUMMARY_MODEL,
      baseUrl: preferences?.llmBaseUrl ?? env.OLLAMA_BASE_URL,
    };
  }

  const apiKey = preferences?.llmApiKey || env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "LLM service not configured. Please set up your OpenAI API key in preferences or environment variables."
    );
  }

  return {
    provider: "openai",
    model: preferences?.llmSummaryModel ?? env.LLM_SUMMARY_MODEL,
    apiKey,
    baseUrl: preferences?.llmBaseUrl ?? env.OPENAI_BASE_URL ?? "https://api.openai.com/v1",
  };
}

async function safeGetUserPreferences(
  userId: string
): Promise<user_preferences | null> {
  try {
    return await getUserPreferencesWithDecryptedKey(userId);
  } catch (error) {
    logger.error("Failed to load user preferences for LLM config", {
      userId,
      error,
    });
    return null;
  }
}

function sanitizeProvider(
  provider?: string | null
): "openai" | "ollama" | null {
  if (provider === "openai" || provider === "ollama") {
    return provider;
  }
  return null;
}

/**
 * Summarize an article
 */
export async function summarizeArticle(
  articleId: string,
  options?: { userId?: string }
): Promise<ArticleSummary> {
  // Try to get from cache first
  const cacheKey = CacheKeys.articleSummary(articleId);

  return await cacheGetOrSet(
    cacheKey,
    async () => {
      // Get article from database
      const article = await prisma.articles.findUnique({
        where: { id: articleId },
        select: {
          id: true,
          title: true,
          content: true,
          summary: true,
          keyPoints: true,
          topics: true,
        },
      });

      if (!article) {
        throw new Error("Article not found");
      }

      // If already has summary in DB, return it
      if (article.summary && article.keyPoints && article.topics) {
        return {
          summary: article.summary,
          keyPoints: article.keyPoints as string[],
          topics: article.topics,
        };
      }

      // Generate summary using LLM
      const llm = await getLLMProvider(options?.userId);
      const result = await llm.summarizeArticle(article.title, article.content);

      // Store in database
      await prisma.articles.update({
        where: { id: articleId },
        data: {
          summary: result.summary,
          keyPoints: result.keyPoints,
          topics: result.topics,
        },
      });

      logger.info("Article summarized", {
        articleId,
        model: llm.getModelName(),
      });

      return result;
    },
    CacheTTL.articleSummary
  ) as ArticleSummary;
}

/**
 * Extract key points from an article
 */
export async function extractKeyPoints(
  articleId: string,
  count = 5,
  options?: { userId?: string }
): Promise<string[]> {
  // Try to get from cache first
  const cacheKey = CacheKeys.articleKeyPoints(articleId);

  const result = await cacheGetOrSet(
    cacheKey,
    async () => {
      // Get article from database
      const article = await prisma.articles.findUnique({
        where: { id: articleId },
        select: {
          id: true,
          content: true,
          keyPoints: true,
        },
      });

      if (!article) {
        throw new Error("Article not found");
      }

      // If already has key points in DB, return them
      if (article.keyPoints && Array.isArray(article.keyPoints)) {
        return article.keyPoints.slice(0, count);
      }

      // Generate key points using LLM
      const llm = await getLLMProvider(options?.userId);
      const keyPoints = await llm.extractKeyPoints(article.content, count);

      // Store in database
      await prisma.articles.update({
        where: { id: articleId },
        data: {
          keyPoints,
        },
      });

      logger.info("Key points extracted", {
        articleId,
        count: keyPoints.length,
      });

      return keyPoints;
    },
    CacheTTL.articleKeyPoints
  );

  if (!result) {
    throw new Error("Failed to extract key points");
  }

  return result as string[];
}

/**
 * Detect topics/tags for an article
 */
export async function detectTopics(
  articleId: string,
  options?: { userId?: string }
): Promise<string[]> {
  // Try to get from cache first
  const cacheKey = CacheKeys.articleTopics(articleId);

  const result = await cacheGetOrSet(
    cacheKey,
    async () => {
      // Get article from database
      const article = await prisma.articles.findUnique({
        where: { id: articleId },
        select: {
          id: true,
          title: true,
          content: true,
          topics: true,
        },
      });

      if (!article) {
        throw new Error("Article not found");
      }

      // If already has topics in DB, return them
      if (article.topics && article.topics.length > 0) {
        return article.topics;
      }

      // Generate topics using LLM
      const llm = await getLLMProvider(options?.userId);
      const topics = await llm.detectTopics(article.title, article.content);

      // Store in database
      await prisma.articles.update({
        where: { id: articleId },
        data: {
          topics,
        },
      });

      logger.info("Topics detected", {
        articleId,
        topics,
      });

      return topics;
    },
    CacheTTL.articleTopics
  );

  if (!result) {
    throw new Error("Failed to detect topics");
  }

  return result as string[];
}

/**
 * Get all topics across articles (for topic cloud)
 */
export async function getAllTopics(limit = 50): Promise<Array<{ topic: string; count: number }>> {
  // Get all articles with topics
  const articles = await prisma.articles.findMany({
    where: {
      topics: {
        isEmpty: false,
      },
    },
    select: {
      topics: true,
    },
    take: 1000, // Limit to recent 1000 articles
    orderBy: {
      publishedAt: "desc",
    },
  });

  // Count topic occurrences
  const topicCounts = new Map<string, number>();

  for (const article of articles) {
    for (const topic of article.topics) {
      topicCounts.set(topic, (topicCounts.get(topic) || 0) + 1);
    }
  }

  // Sort by count and return top topics
  const sortedTopics = Array.from(topicCounts.entries())
    .map(([topic, count]) => ({ topic, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);

  return sortedTopics;
}

/**
 * Get articles by topic
 */
export async function getArticlesByTopic(
  topic: string,
  limit = 20,
  sortBy: "publishedAt" | "relevance" | "title" | "feed" | "updatedAt" = "publishedAt",
  sortDirection: "asc" | "desc" = "desc"
) {
  // Build orderBy clause based on sort option
  let orderBy: any;
  
  switch (sortBy) {
    case "title":
      orderBy = { title: sortDirection };
      break;
    case "updatedAt":
      orderBy = { updatedAt: sortDirection };
      break;
    case "feed":
      orderBy = [
        { feeds: { name: sortDirection } },
        { publishedAt: "desc" }
      ];
      break;
    case "relevance":
      // Fall back to publishedAt for topics
      orderBy = { publishedAt: "desc" };
      break;
    case "publishedAt":
    default:
      orderBy = { publishedAt: sortDirection };
      break;
  }

  const articles = await prisma.articles.findMany({
    where: {
      topics: {
        has: topic,
      },
    },
    include: {
      feeds: true,
    },
    take: limit,
    orderBy,
  });

  return articles;
}

/**
 * Batch summarize articles
 */
export async function batchSummarizeArticles(
  articleIds: string[],
  options?: { userId?: string }
): Promise<Map<string, ArticleSummary>> {
  const results = new Map<string, ArticleSummary>();

  // Process in batches to avoid overwhelming the LLM API
  const batchSize = 5;
  for (let i = 0; i < articleIds.length; i += batchSize) {
    const batch = articleIds.slice(i, i + batchSize);

    await Promise.all(
      batch.map(async (articleId) => {
        try {
          const summary = await summarizeArticle(articleId, options);
          results.set(articleId, summary);
        } catch (error) {
          logger.error("Failed to summarize article in batch", {
            articleId,
            error,
          });
        }
      })
    );
  }

  return results;
}

/**
 * Summarize article with cost tracking
 * This version tracks token usage and costs for monitoring
 */
export async function summarizeArticleWithTracking(
  articleId: string,
  options?: {
    userId?: string;
    includeKeyPoints?: boolean;
    includeTopics?: boolean;
  }
): Promise<{
  summary: ArticleSummary;
  tokens: { prompt: number; completion: number; total: number };
  model: string;
  provider: string;
}> {
  // Get article from database
  const article = await prisma.articles.findUnique({
    where: { id: articleId },
    select: {
      id: true,
      title: true,
      content: true,
      summary: true,
      keyPoints: true,
      topics: true,
    },
  });

  if (!article) {
    throw new Error("Article not found");
  }

  // If already has summary in DB and we're not forcing regeneration, return it
  if (article.summary && article.keyPoints && article.topics) {
    return {
      summary: {
        summary: article.summary,
        keyPoints: article.keyPoints as string[],
        topics: article.topics,
      },
      tokens: { prompt: 0, completion: 0, total: 0 },
      model: "cached",
      provider: "cached",
    };
  }

  // Get config to determine provider
  const config = await resolveLLMConfig(options?.userId);
  const provider = config.provider;

  // Generate summary using LLM and get token info
  const llm = await getLLMProvider(options?.userId);

  // Call complete directly to get token usage
  const systemPrompt = `You are a helpful assistant that summarizes articles.
Provide a concise summary, extract 3-5 key points, identify 3-5 main topics/tags, and determine the sentiment.
Respond in JSON format with keys: summary, keyPoints (array), topics (array), sentiment (positive/neutral/negative).`;

  const truncatedContent =
    article.content.length > 40000
      ? article.content.substring(0, 40000) + "..."
      : article.content;

  const prompt = `Title: ${article.title}\n\nContent: ${truncatedContent}\n\nPlease analyze this article and provide a summary, key points, topics, and sentiment.`;

  const response = await llm.complete({
    prompt,
    systemPrompt,
    temperature: 0.3,
    maxTokens: 1000,
  });

  // Parse the response
  let summary: ArticleSummary;
  try {
    const parsed = JSON.parse(response.content);
    summary = {
      summary: parsed.summary || "",
      keyPoints:
        options?.includeKeyPoints && Array.isArray(parsed.keyPoints)
          ? parsed.keyPoints
          : [],
      topics:
        options?.includeTopics && Array.isArray(parsed.topics)
          ? parsed.topics
          : [],
      sentiment: ["positive", "neutral", "negative"].includes(parsed.sentiment)
        ? parsed.sentiment
        : "neutral",
    };
  } catch (parseError) {
    logger.warn("Failed to parse LLM JSON response, using fallback", {
      parseError,
    });
    summary = {
      summary: response.content.substring(0, 500),
      keyPoints: [],
      topics: [],
      sentiment: "neutral",
    };
  }

  // Store in database
  await prisma.articles.update({
    where: { id: articleId },
    data: {
      summary: summary.summary,
      keyPoints: summary.keyPoints,
      topics: summary.topics,
    },
  });

  // Track cost
  trackSummarizationCost({
    provider,
    model: response.model,
    tokensPrompt: response.tokens.prompt,
    tokensCompletion: response.tokens.completion,
    operation: "article_summarization",
    userId: options?.userId,
    articleId,
  });

  logger.info("Article summarized with tracking", {
    articleId,
    model: response.model,
    tokens: response.tokens.total,
  });

  return {
    summary,
    tokens: response.tokens,
    model: response.model,
    provider,
  };
}

/**
 * Batch summarize articles with cost tracking
 */
export async function batchSummarizeArticlesWithTracking(
  articleIds: string[],
  options?: {
    userId?: string;
    includeKeyPoints?: boolean;
    includeTopics?: boolean;
  }
): Promise<{
  success: number;
  failed: number;
  errors: string[];
  totalTokens: number;
  totalCost: number;
}> {
  const result = {
    success: 0,
    failed: 0,
    errors: [] as string[],
    totalTokens: 0,
    totalCost: 0,
  };

  // Process in batches to avoid overwhelming the LLM API
  const batchSize = 5;
  for (let i = 0; i < articleIds.length; i += batchSize) {
    const batch = articleIds.slice(i, i + batchSize);

    await Promise.all(
      batch.map(async (articleId) => {
        try {
          const response = await summarizeArticleWithTracking(articleId, options);
          result.success++;
          result.totalTokens += response.tokens.total;
        } catch (error) {
          result.failed++;
          const errorMsg =
            error instanceof Error ? error.message : "Unknown error";
          result.errors.push(`${articleId}: ${errorMsg}`);
          logger.error("Failed to summarize article in batch with tracking", {
            articleId,
            error,
          });
        }
      })
    );
  }

  return result;
}


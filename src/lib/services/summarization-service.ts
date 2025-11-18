/**
 * Summarization Service
 * Handles article summarization, key points extraction, and topic detection
 */

import { prisma } from "../db";
import { env } from "@/src/env";
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
import type { UserPreferences } from "@prisma/client";

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
      model: preferences?.llmModel ?? env.LLM_MODEL,
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
    model: preferences?.llmModel ?? env.LLM_MODEL,
    apiKey,
    baseUrl: preferences?.llmBaseUrl ?? env.OPENAI_BASE_URL ?? "https://api.openai.com/v1",
  };
}

async function safeGetUserPreferences(
  userId: string
): Promise<UserPreferences | null> {
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
      const article = await prisma.article.findUnique({
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
      await prisma.article.update({
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
      const article = await prisma.article.findUnique({
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
      await prisma.article.update({
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
      const article = await prisma.article.findUnique({
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
      await prisma.article.update({
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
  const articles = await prisma.article.findMany({
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
  limit = 20
): Promise<Array<{ id: string; title: string; excerpt: string | null }>> {
  const articles = await prisma.article.findMany({
    where: {
      topics: {
        has: topic,
      },
    },
    select: {
      id: true,
      title: true,
      excerpt: true,
    },
    take: limit,
    orderBy: {
      publishedAt: "desc",
    },
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


/**
 * Summarization Cost Tracker
 * Tracks API usage and costs for article summarization
 */

import { logger } from "@/lib/logger";

interface CostEntry {
  timestamp: Date;
  provider: string;
  model: string;
  tokensPrompt: number;
  tokensCompletion: number;
  tokensTotal: number;
  cost: number;
  operation: string;
  userId?: string;
  articleId?: string;
}

// In-memory storage (in production, this should be in a database)
let costHistory: CostEntry[] = [];
let totalTokens = 0;
let totalCost = 0;

/**
 * OpenAI pricing (as of 2025)
 * GPT-4 Turbo: $0.01/1K prompt tokens, $0.03/1K completion tokens
 * GPT-3.5 Turbo: $0.0005/1K prompt tokens, $0.0015/1K completion tokens
 */
const OPENAI_PRICING: Record<string, { prompt: number; completion: number }> = {
  "gpt-4-turbo": { prompt: 0.01, completion: 0.03 },
  "gpt-4": { prompt: 0.03, completion: 0.06 },
  "gpt-3.5-turbo": { prompt: 0.0005, completion: 0.0015 },
  default: { prompt: 0.01, completion: 0.03 }, // Conservative estimate
};

/**
 * Calculate cost for OpenAI models
 */
function calculateOpenAICost(
  model: string,
  promptTokens: number,
  completionTokens: number
): number {
  const pricing = OPENAI_PRICING[model] || OPENAI_PRICING.default;
  const promptCost = (promptTokens / 1000) * pricing.prompt;
  const completionCost = (completionTokens / 1000) * pricing.completion;
  return promptCost + completionCost;
}

/**
 * Track summarization cost
 */
export function trackSummarizationCost(params: {
  provider: string;
  model: string;
  tokensPrompt: number;
  tokensCompletion: number;
  operation?: string;
  userId?: string;
  articleId?: string;
}): void {
  const {
    provider,
    model,
    tokensPrompt,
    tokensCompletion,
    operation = "summarization",
    userId,
    articleId,
  } = params;

  const tokensTotal = tokensPrompt + tokensCompletion;
  let cost = 0;

  // Calculate cost based on provider
  if (provider === "openai") {
    cost = calculateOpenAICost(model, tokensPrompt, tokensCompletion);
  }
  // Ollama and local models have no cost

  const entry: CostEntry = {
    timestamp: new Date(),
    provider,
    model,
    tokensPrompt,
    tokensCompletion,
    tokensTotal,
    cost,
    operation,
    userId,
    articleId,
  };

  costHistory.push(entry);
  totalTokens += tokensTotal;
  totalCost += cost;

  logger.info("Tracked summarization cost", {
    provider,
    model,
    tokensPrompt,
    tokensCompletion,
    tokensTotal,
    cost: cost.toFixed(6),
    operation,
    userId,
  });
}

/**
 * Get cost statistics
 */
export function getSummarizationCostStats(): {
  totalTokens: number;
  totalCost: number;
  entriesCount: number;
  byProvider: Record<
    string,
    { tokens: number; cost: number; count: number; models: Set<string> }
  >;
  byUser: Record<string, { tokens: number; cost: number; count: number }>;
  last24Hours: { tokens: number; cost: number; count: number };
  last7Days: { tokens: number; cost: number; count: number };
  last30Days: { tokens: number; cost: number; count: number };
} {
  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Calculate by provider
  const byProvider: Record<
    string,
    { tokens: number; cost: number; count: number; models: Set<string> }
  > = {};

  for (const entry of costHistory) {
    if (!byProvider[entry.provider]) {
      byProvider[entry.provider] = {
        tokens: 0,
        cost: 0,
        count: 0,
        models: new Set(),
      };
    }
    byProvider[entry.provider].tokens += entry.tokensTotal;
    byProvider[entry.provider].cost += entry.cost;
    byProvider[entry.provider].count++;
    byProvider[entry.provider].models.add(entry.model);
  }

  // Calculate by user
  const byUser: Record<string, { tokens: number; cost: number; count: number }> =
    {};

  for (const entry of costHistory) {
    if (entry.userId) {
      if (!byUser[entry.userId]) {
        byUser[entry.userId] = { tokens: 0, cost: 0, count: 0 };
      }
      byUser[entry.userId].tokens += entry.tokensTotal;
      byUser[entry.userId].cost += entry.cost;
      byUser[entry.userId].count++;
    }
  }

  // Calculate time-based stats
  const last24Hours = costHistory
    .filter((e) => e.timestamp >= oneDayAgo)
    .reduce(
      (acc, e) => ({
        tokens: acc.tokens + e.tokensTotal,
        cost: acc.cost + e.cost,
        count: acc.count + 1,
      }),
      { tokens: 0, cost: 0, count: 0 }
    );

  const last7Days = costHistory
    .filter((e) => e.timestamp >= sevenDaysAgo)
    .reduce(
      (acc, e) => ({
        tokens: acc.tokens + e.tokensTotal,
        cost: acc.cost + e.cost,
        count: acc.count + 1,
      }),
      { tokens: 0, cost: 0, count: 0 }
    );

  const last30Days = costHistory
    .filter((e) => e.timestamp >= thirtyDaysAgo)
    .reduce(
      (acc, e) => ({
        tokens: acc.tokens + e.tokensTotal,
        cost: acc.cost + e.cost,
        count: acc.count + 1,
      }),
      { tokens: 0, cost: 0, count: 0 }
    );

  return {
    totalTokens,
    totalCost,
    entriesCount: costHistory.length,
    byProvider,
    byUser,
    last24Hours,
    last7Days,
    last30Days,
  };
}

/**
 * Get cost statistics for a specific user
 */
export function getUserSummarizationCostStats(userId: string): {
  totalTokens: number;
  totalCost: number;
  entriesCount: number;
  byProvider: Record<string, { tokens: number; cost: number; count: number }>;
  last24Hours: { tokens: number; cost: number; count: number };
  last7Days: { tokens: number; cost: number; count: number };
  last30Days: { tokens: number; cost: number; count: number };
} {
  const userEntries = costHistory.filter((e) => e.userId === userId);

  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const totalTokens = userEntries.reduce((sum, e) => sum + e.tokensTotal, 0);
  const totalCost = userEntries.reduce((sum, e) => sum + e.cost, 0);

  // Calculate by provider
  const byProvider: Record<
    string,
    { tokens: number; cost: number; count: number }
  > = {};

  for (const entry of userEntries) {
    if (!byProvider[entry.provider]) {
      byProvider[entry.provider] = { tokens: 0, cost: 0, count: 0 };
    }
    byProvider[entry.provider].tokens += entry.tokensTotal;
    byProvider[entry.provider].cost += entry.cost;
    byProvider[entry.provider].count++;
  }

  // Calculate time-based stats
  const last24Hours = userEntries
    .filter((e) => e.timestamp >= oneDayAgo)
    .reduce(
      (acc, e) => ({
        tokens: acc.tokens + e.tokensTotal,
        cost: acc.cost + e.cost,
        count: acc.count + 1,
      }),
      { tokens: 0, cost: 0, count: 0 }
    );

  const last7Days = userEntries
    .filter((e) => e.timestamp >= sevenDaysAgo)
    .reduce(
      (acc, e) => ({
        tokens: acc.tokens + e.tokensTotal,
        cost: acc.cost + e.cost,
        count: acc.count + 1,
      }),
      { tokens: 0, cost: 0, count: 0 }
    );

  const last30Days = userEntries
    .filter((e) => e.timestamp >= thirtyDaysAgo)
    .reduce(
      (acc, e) => ({
        tokens: acc.tokens + e.tokensTotal,
        cost: acc.cost + e.cost,
        count: acc.count + 1,
      }),
      { tokens: 0, cost: 0, count: 0 }
    );

  return {
    totalTokens,
    totalCost,
    entriesCount: userEntries.length,
    byProvider,
    last24Hours,
    last7Days,
    last30Days,
  };
}

/**
 * Get recent cost entries
 */
export function getRecentSummarizationEntries(limit: number = 100): CostEntry[] {
  return costHistory.slice(-limit).reverse();
}

/**
 * Get recent cost entries for a specific user
 */
export function getUserRecentSummarizationEntries(
  userId: string,
  limit: number = 100
): CostEntry[] {
  return costHistory
    .filter((e) => e.userId === userId)
    .slice(-limit)
    .reverse();
}

/**
 * Clear cost history
 */
export function clearSummarizationCostHistory(): void {
  const previousCount = costHistory.length;
  const previousTotal = totalCost;

  costHistory = [];
  totalTokens = 0;
  totalCost = 0;

  logger.info("Cleared summarization cost history", {
    previousCount,
    previousTotal: previousTotal.toFixed(6),
  });
}

/**
 * Estimate cost for text summarization
 */
export function estimateSummarizationCost(params: {
  textLength: number;
  provider: "openai" | "ollama";
  model?: string;
}): {
  estimatedPromptTokens: number;
  estimatedCompletionTokens: number;
  estimatedTotalTokens: number;
  estimatedCost: number;
} {
  const { textLength, provider, model = "gpt-3.5-turbo" } = params;

  // Rough estimate: 4 characters per token for prompt
  const estimatedPromptTokens = Math.ceil(textLength / 4);
  // Summary is typically 10-20% of original length
  const estimatedCompletionTokens = Math.ceil(estimatedPromptTokens * 0.15);
  const estimatedTotalTokens = estimatedPromptTokens + estimatedCompletionTokens;

  let estimatedCost = 0;
  if (provider === "openai") {
    estimatedCost = calculateOpenAICost(
      model,
      estimatedPromptTokens,
      estimatedCompletionTokens
    );
  }

  return {
    estimatedPromptTokens,
    estimatedCompletionTokens,
    estimatedTotalTokens,
    estimatedCost,
  };
}

/**
 * Get cost report for a date range
 */
export function getSummarizationCostReport(
  startDate: Date,
  endDate: Date
): {
  period: { start: Date; end: Date };
  totalTokens: number;
  totalCost: number;
  entriesCount: number;
  byProvider: Record<string, { tokens: number; cost: number; count: number }>;
  byUser: Record<string, { tokens: number; cost: number; count: number }>;
  dailyBreakdown: Array<{
    date: string;
    tokens: number;
    cost: number;
    count: number;
  }>;
} {
  const entries = costHistory.filter(
    (e) => e.timestamp >= startDate && e.timestamp <= endDate
  );

  const totalTokens = entries.reduce((sum, e) => sum + e.tokensTotal, 0);
  const totalCost = entries.reduce((sum, e) => sum + e.cost, 0);

  // Calculate by provider
  const byProvider: Record<
    string,
    { tokens: number; cost: number; count: number }
  > = {};

  for (const entry of entries) {
    if (!byProvider[entry.provider]) {
      byProvider[entry.provider] = { tokens: 0, cost: 0, count: 0 };
    }
    byProvider[entry.provider].tokens += entry.tokensTotal;
    byProvider[entry.provider].cost += entry.cost;
    byProvider[entry.provider].count++;
  }

  // Calculate by user
  const byUser: Record<string, { tokens: number; cost: number; count: number }> =
    {};

  for (const entry of entries) {
    if (entry.userId) {
      if (!byUser[entry.userId]) {
        byUser[entry.userId] = { tokens: 0, cost: 0, count: 0 };
      }
      byUser[entry.userId].tokens += entry.tokensTotal;
      byUser[entry.userId].cost += entry.cost;
      byUser[entry.userId].count++;
    }
  }

  // Group by day
  const dailyMap = new Map<
    string,
    { tokens: number; cost: number; count: number }
  >();

  for (const entry of entries) {
    const dateKey = entry.timestamp.toISOString().split("T")[0];
    const existing = dailyMap.get(dateKey) || { tokens: 0, cost: 0, count: 0 };
    dailyMap.set(dateKey, {
      tokens: existing.tokens + entry.tokensTotal,
      cost: existing.cost + entry.cost,
      count: existing.count + 1,
    });
  }

  const dailyBreakdown = Array.from(dailyMap.entries())
    .map(([date, data]) => ({ date, ...data }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return {
    period: { start: startDate, end: endDate },
    totalTokens,
    totalCost,
    entriesCount: entries.length,
    byProvider,
    byUser,
    dailyBreakdown,
  };
}

/**
 * Embedding Cost Tracker
 * Tracks API usage and costs for embedding generation
 */

import { logger } from "@/lib/logger";
import { OpenAIEmbeddingProvider } from "@/lib/embeddings/openai-provider";

interface CostEntry {
  timestamp: Date;
  provider: string;
  tokens: number;
  cost: number;
  operation: string;
}

// In-memory storage (in production, this should be in a database)
let costHistory: CostEntry[] = [];
let totalTokens = 0;
let totalCost = 0;

/**
 * Track embedding cost
 */
export function trackEmbeddingCost(
  provider: string,
  tokens: number,
  operation: string = "embedding"
): void {
  let cost = 0;

  // Calculate cost based on provider
  if (provider.includes("openai") || provider.includes("text-embedding")) {
    cost = OpenAIEmbeddingProvider.calculateCost(tokens);
  }
  // Local models have no cost

  const entry: CostEntry = {
    timestamp: new Date(),
    provider,
    tokens,
    cost,
    operation,
  };

  costHistory.push(entry);
  totalTokens += tokens;
  totalCost += cost;

  logger.info("Tracked embedding cost", {
    provider,
    tokens,
    cost: cost.toFixed(6),
    operation,
  });
}

/**
 * Get cost statistics
 */
export function getCostStats(): {
  totalTokens: number;
  totalCost: number;
  entriesCount: number;
  byProvider: Record<string, { tokens: number; cost: number; count: number }>;
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
    { tokens: number; cost: number; count: number }
  > = {};

  for (const entry of costHistory) {
    if (!byProvider[entry.provider]) {
      byProvider[entry.provider] = { tokens: 0, cost: 0, count: 0 };
    }
    byProvider[entry.provider].tokens += entry.tokens;
    byProvider[entry.provider].cost += entry.cost;
    byProvider[entry.provider].count++;
  }

  // Calculate time-based stats
  const last24Hours = costHistory
    .filter((e) => e.timestamp >= oneDayAgo)
    .reduce(
      (acc, e) => ({
        tokens: acc.tokens + e.tokens,
        cost: acc.cost + e.cost,
        count: acc.count + 1,
      }),
      { tokens: 0, cost: 0, count: 0 }
    );

  const last7Days = costHistory
    .filter((e) => e.timestamp >= sevenDaysAgo)
    .reduce(
      (acc, e) => ({
        tokens: acc.tokens + e.tokens,
        cost: acc.cost + e.cost,
        count: acc.count + 1,
      }),
      { tokens: 0, cost: 0, count: 0 }
    );

  const last30Days = costHistory
    .filter((e) => e.timestamp >= thirtyDaysAgo)
    .reduce(
      (acc, e) => ({
        tokens: acc.tokens + e.tokens,
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
    last24Hours,
    last7Days,
    last30Days,
  };
}

/**
 * Get recent cost entries
 */
export function getRecentCostEntries(limit: number = 100): CostEntry[] {
  return costHistory.slice(-limit).reverse();
}

/**
 * Clear cost history
 */
export function clearCostHistory(): void {
  const previousCount = costHistory.length;
  const previousTotal = totalCost;

  costHistory = [];
  totalTokens = 0;
  totalCost = 0;

  logger.info("Cleared cost history", {
    previousCount,
    previousTotal: previousTotal.toFixed(6),
  });
}

/**
 * Estimate cost for text
 */
export function estimateCost(
  textLength: number,
  provider: "openai" | "local" = "openai"
): {
  estimatedTokens: number;
  estimatedCost: number;
} {
  const estimatedTokens = Math.ceil(textLength / 4);

  let estimatedCost = 0;
  if (provider === "openai") {
    estimatedCost = OpenAIEmbeddingProvider.calculateCost(estimatedTokens);
  }

  return {
    estimatedTokens,
    estimatedCost,
  };
}

/**
 * Get cost report for a date range
 */
export function getCostReport(
  startDate: Date,
  endDate: Date
): {
  period: { start: Date; end: Date };
  totalTokens: number;
  totalCost: number;
  entriesCount: number;
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

  const totalTokens = entries.reduce((sum, e) => sum + e.tokens, 0);
  const totalCost = entries.reduce((sum, e) => sum + e.cost, 0);

  // Group by day
  const dailyMap = new Map<
    string,
    { tokens: number; cost: number; count: number }
  >();

  for (const entry of entries) {
    const dateKey = entry.timestamp.toISOString().split("T")[0];
    const existing = dailyMap.get(dateKey) || { tokens: 0, cost: 0, count: 0 };
    dailyMap.set(dateKey, {
      tokens: existing.tokens + entry.tokens,
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
    dailyBreakdown,
  };
}


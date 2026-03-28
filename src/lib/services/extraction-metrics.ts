import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";

/**
 * Extraction metrics for monitoring and analysis
 */
export interface ExtractionMetrics {
  totalAttempts: number;
  successfulExtractions: number;
  failedExtractions: number;
  successRate: number;
  rateLimitedDomains: number;
  averageDelay: number;
  domainStats: Array<{
    domain: string;
    attempts: number;
    failures: number;
    rateLimits: number;
    successRate: number;
    lastExtracted: Date;
  }>;
}

/**
 * Time period for metrics
 */
export type MetricsPeriod = "24h" | "7d" | "30d" | "all";

/**
 * Get extraction metrics for a time period
 * @param period - Time period to analyze
 * @returns Extraction metrics
 */
export async function getExtractionMetrics(
  period: MetricsPeriod = "24h"
): Promise<ExtractionMetrics> {
  const cutoffDate = getPeriodCutoffDate(period);

  try {
    // Get all domain logs within the period
    const domainLogs = await prisma.domain_extraction_log.findMany({
      where: cutoffDate
        ? {
            lastExtractedAt: {
              gte: cutoffDate,
            },
          }
        : undefined,
      orderBy: {
        lastExtractedAt: "desc",
      },
    });

    // Calculate aggregate metrics
    const totalDomains = domainLogs.length;
    const totalFailures = domainLogs.reduce(
      (sum, log) => sum + log.failureCount,
      0
    );
    const rateLimitedDomains = domainLogs.filter(
      (log) => log.rateLimitCount > 0
    ).length;

    // Estimate total attempts (this is approximate as we don't track every single attempt)
    // We can estimate based on failure counts and assuming most extractions succeed
    const totalAttempts = totalDomains * 5; // Rough estimate
    const failedExtractions = totalFailures;
    const successfulExtractions = Math.max(0, totalAttempts - failedExtractions);
    const successRate =
      totalAttempts > 0 ? (successfulExtractions / totalAttempts) * 100 : 0;

    // Calculate average delay across domains
    const domainsWithDelay = domainLogs.filter((log) => log.crawlDelay);
    const averageDelay =
      domainsWithDelay.length > 0
        ? domainsWithDelay.reduce(
            (sum, log) => sum + (log.crawlDelay || 0),
            0
          ) / domainsWithDelay.length
        : 0;

    // Build domain-level stats
    const domainStats = domainLogs.slice(0, 50).map((log) => ({
      domain: log.domain,
      attempts: 5, // Rough estimate
      failures: log.failureCount,
      rateLimits: log.rateLimitCount,
      successRate: ((5 - log.failureCount) / 5) * 100,
      lastExtracted: log.lastExtractedAt,
    }));

    return {
      totalAttempts,
      successfulExtractions,
      failedExtractions,
      successRate,
      rateLimitedDomains,
      averageDelay,
      domainStats,
    };
  } catch (error) {
    logger.error(`[ExtractionMetrics] Failed to get metrics: ${error}`);
    throw error;
  }
}

/**
 * Get problematic domains that are frequently failing or rate limiting
 * @param limit - Maximum number of domains to return
 * @returns List of problematic domains with their stats
 */
export async function getProblematicDomains(limit: number = 20): Promise<
  Array<{
    domain: string;
    failureCount: number;
    rateLimitCount: number;
    lastError?: string;
    lastExtractedAt: Date;
    severity: "critical" | "high" | "medium";
  }>
> {
  try {
    const domains = await prisma.domain_extraction_log.findMany({
      where: {
        OR: [
          { failureCount: { gte: 3 } },
          { rateLimitCount: { gte: 1 } },
        ],
      },
      orderBy: [
        { rateLimitCount: "desc" },
        { failureCount: "desc" },
      ],
      take: limit,
    });

    return domains.map((log) => ({
      domain: log.domain,
      failureCount: log.failureCount,
      rateLimitCount: log.rateLimitCount,
      lastError: log.lastError || undefined,
      lastExtractedAt: log.lastExtractedAt,
      severity: getSeverity(log.failureCount, log.rateLimitCount),
    }));
  } catch (error) {
    logger.error(`[ExtractionMetrics] Failed to get problematic domains: ${error}`);
    throw error;
  }
}

/**
 * Get domains with active rate limiting
 * These domains should be approached with caution
 */
export async function getRateLimitedDomains(): Promise<
  Array<{
    domain: string;
    rateLimitCount: number;
    recommendedDelay: number;
    lastExtractedAt: Date;
  }>
> {
  try {
    const domains = await prisma.domain_extraction_log.findMany({
      where: {
        rateLimitCount: {
          gt: 0,
        },
      },
      orderBy: {
        rateLimitCount: "desc",
      },
    });

    return domains.map((log) => ({
      domain: log.domain,
      rateLimitCount: log.rateLimitCount,
      recommendedDelay: calculateRecommendedDelay(log.rateLimitCount),
      lastExtractedAt: log.lastExtractedAt,
    }));
  } catch (error) {
    logger.error(`[ExtractionMetrics] Failed to get rate limited domains: ${error}`);
    throw error;
  }
}

/**
 * Get domain health score (0-100)
 * Higher score = healthier domain
 */
export async function getDomainHealthScore(domain: string): Promise<{
  score: number;
  status: "healthy" | "warning" | "critical";
  details: {
    failureCount: number;
    rateLimitCount: number;
    lastExtractedAt?: Date;
  };
}> {
  try {
    const log = await prisma.domain_extraction_log.findUnique({
      where: { domain },
    });

    if (!log) {
      // No history, assume healthy
      return {
        score: 100,
        status: "healthy",
        details: {
          failureCount: 0,
          rateLimitCount: 0,
        },
      };
    }

    // Calculate score based on failures and rate limits
    let score = 100;
    score -= log.failureCount * 10; // -10 points per failure
    score -= log.rateLimitCount * 20; // -20 points per rate limit

    score = Math.max(0, Math.min(100, score)); // Clamp to 0-100

    const status =
      score >= 70 ? "healthy" : score >= 40 ? "warning" : "critical";

    return {
      score,
      status,
      details: {
        failureCount: log.failureCount,
        rateLimitCount: log.rateLimitCount,
        lastExtractedAt: log.lastExtractedAt,
      },
    };
  } catch (error) {
    logger.error(`[ExtractionMetrics] Failed to get domain health score: ${error}`);
    throw error;
  }
}

/**
 * Clear stale extraction logs
 * Removes logs older than the specified number of days
 * @param daysToKeep - Number of days of history to keep
 */
export async function cleanupStaleExtractionLogs(
  daysToKeep: number = 90
): Promise<number> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

  try {
    const result = await prisma.domain_extraction_log.deleteMany({
      where: {
        lastExtractedAt: {
          lt: cutoffDate,
        },
        // Only delete if no recent failures or rate limits
        failureCount: 0,
        rateLimitCount: 0,
      },
    });

    logger.info(
      `[ExtractionMetrics] Cleaned up ${result.count} stale extraction logs`
    );

    return result.count;
  } catch (error) {
    logger.error(`[ExtractionMetrics] Failed to cleanup stale logs: ${error}`);
    throw error;
  }
}

/**
 * Helper: Get cutoff date for a period
 */
function getPeriodCutoffDate(period: MetricsPeriod): Date | null {
  if (period === "all") return null;

  const now = new Date();
  switch (period) {
    case "24h":
      return new Date(now.getTime() - 24 * 60 * 60 * 1000);
    case "7d":
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case "30d":
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    default:
      return null;
  }
}

/**
 * Helper: Determine severity based on failure and rate limit counts
 */
function getSeverity(
  failureCount: number,
  rateLimitCount: number
): "critical" | "high" | "medium" {
  if (rateLimitCount >= 5 || failureCount >= 10) {
    return "critical";
  } else if (rateLimitCount >= 2 || failureCount >= 5) {
    return "high";
  } else {
    return "medium";
  }
}

/**
 * Helper: Calculate recommended delay based on rate limit count
 */
function calculateRecommendedDelay(rateLimitCount: number): number {
  if (rateLimitCount >= 10) {
    return 120 * 1000; // 2 minutes
  } else if (rateLimitCount >= 5) {
    return 60 * 1000; // 1 minute
  } else if (rateLimitCount >= 2) {
    return 30 * 1000; // 30 seconds
  } else {
    return 10 * 1000; // 10 seconds
  }
}

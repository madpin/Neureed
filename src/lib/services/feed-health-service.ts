import { prisma } from "@/lib/db";

/**
 * Feed Health Service
 *
 * Manages feed health tracking, error logging, and auto-disable functionality
 */

export interface FeedHealthStatus {
  feedId: string;
  healthStatus: "healthy" | "warning" | "error" | "disabled";
  consecutiveFailures: number;
  lastSuccessfulFetch: Date | null;
  lastError: string | null;
  httpStatus: number | null;
  redirectUrl: string | null;
}

export interface FeedErrorLog {
  id: string;
  feedId: string;
  errorType: string;
  errorMessage: string;
  httpStatus: number | null;
  timestamp: Date;
}

/**
 * Get health status for a specific feed
 */
export async function getFeedHealth(feedId: string): Promise<FeedHealthStatus | null> {
  const feed = await prisma.feeds.findUnique({
    where: { id: feedId },
    select: {
      id: true,
      healthStatus: true,
      consecutiveFailures: true,
      lastSuccessfulFetch: true,
      httpStatus: true,
      redirectUrl: true,
      feed_error_log: {
        orderBy: { timestamp: "desc" },
        take: 1,
      },
    },
  });

  if (!feed) return null;

  return {
    feedId: feed.id,
    healthStatus: feed.healthStatus as "healthy" | "warning" | "error" | "disabled",
    consecutiveFailures: feed.consecutiveFailures,
    lastSuccessfulFetch: feed.lastSuccessfulFetch,
    lastError: feed.feed_error_log[0]?.errorMessage || null,
    httpStatus: feed.httpStatus,
    redirectUrl: feed.redirectUrl,
  };
}

/**
 * Get health status for multiple feeds
 */
export async function getBulkFeedHealth(feedIds: string[]): Promise<FeedHealthStatus[]> {
  const feeds = await prisma.feeds.findMany({
    where: { id: { in: feedIds } },
    select: {
      id: true,
      healthStatus: true,
      consecutiveFailures: true,
      lastSuccessfulFetch: true,
      httpStatus: true,
      redirectUrl: true,
      feed_error_log: {
        orderBy: { timestamp: "desc" },
        take: 1,
      },
    },
  });

  return feeds.map((feed) => ({
    feedId: feed.id,
    healthStatus: feed.healthStatus as "healthy" | "warning" | "error" | "disabled",
    consecutiveFailures: feed.consecutiveFailures,
    lastSuccessfulFetch: feed.lastSuccessfulFetch,
    lastError: feed.feed_error_log[0]?.errorMessage || null,
    httpStatus: feed.httpStatus,
    redirectUrl: feed.redirectUrl,
  }));
}

/**
 * Record a successful feed fetch
 */
export async function recordFeedSuccess(feedId: string): Promise<void> {
  await prisma.feeds.update({
    where: { id: feedId },
    data: {
      healthStatus: "healthy",
      consecutiveFailures: 0,
      lastSuccessfulFetch: new Date(),
      httpStatus: 200,
    },
  });
}

/**
 * Record a feed fetch failure
 */
export async function recordFeedFailure(
  feedId: string,
  errorType: string,
  errorMessage: string,
  httpStatus?: number
): Promise<void> {
  const feed = await prisma.feeds.findUnique({
    where: { id: feedId },
    select: {
      consecutiveFailures: true,
      autoDisableThreshold: true,
    },
  });

  if (!feed) return;

  const newFailureCount = feed.consecutiveFailures + 1;
  const shouldDisable = newFailureCount >= feed.autoDisableThreshold;

  // Update feed health status
  await prisma.feeds.update({
    where: { id: feedId },
    data: {
      consecutiveFailures: newFailureCount,
      healthStatus: shouldDisable ? "disabled" : newFailureCount >= 3 ? "error" : "warning",
      httpStatus: httpStatus || null,
    },
  });

  // Log the error
  await prisma.feed_error_log.create({
    data: {
      id: `fel_${feedId}_${Date.now()}`,
      feedId,
      errorType,
      errorMessage,
      httpStatus: httpStatus || null,
    },
  });
}

/**
 * Get error logs for a feed
 */
export async function getFeedErrorLogs(
  feedId: string,
  limit: number = 10
): Promise<FeedErrorLog[]> {
  const logs = await prisma.feed_error_log.findMany({
    where: { feedId },
    orderBy: { timestamp: "desc" },
    take: limit,
  });

  return logs;
}

/**
 * Clear error logs for a feed
 */
export async function clearFeedErrorLogs(feedId: string): Promise<void> {
  await prisma.feed_error_log.deleteMany({
    where: { feedId },
  });
}

/**
 * Reset feed health (clear failures, set to healthy)
 */
export async function resetFeedHealth(feedId: string): Promise<void> {
  await prisma.$transaction([
    prisma.feeds.update({
      where: { id: feedId },
      data: {
        healthStatus: "healthy",
        consecutiveFailures: 0,
        httpStatus: null,
      },
    }),
    prisma.feed_error_log.deleteMany({
      where: { feedId },
    }),
  ]);
}

/**
 * Get unhealthy feeds for a user
 */
export async function getUnhealthyFeeds(
  userId: string
): Promise<FeedHealthStatus[]> {
  const userFeeds = await prisma.user_feeds.findMany({
    where: { userId },
    select: { feedId: true },
  });

  const feedIds = userFeeds.map((uf) => uf.feedId);

  const feeds = await prisma.feeds.findMany({
    where: {
      id: { in: feedIds },
      healthStatus: { in: ["warning", "error", "disabled"] },
    },
    select: {
      id: true,
      healthStatus: true,
      consecutiveFailures: true,
      lastSuccessfulFetch: true,
      httpStatus: true,
      redirectUrl: true,
      feed_error_log: {
        orderBy: { timestamp: "desc" },
        take: 1,
      },
    },
  });

  return feeds.map((feed) => ({
    feedId: feed.id,
    healthStatus: feed.healthStatus as "healthy" | "warning" | "error" | "disabled",
    consecutiveFailures: feed.consecutiveFailures,
    lastSuccessfulFetch: feed.lastSuccessfulFetch,
    lastError: feed.feed_error_log[0]?.errorMessage || null,
    httpStatus: feed.httpStatus,
    redirectUrl: feed.redirectUrl,
  }));
}

/**
 * Update feed auto-disable threshold
 */
export async function updateAutoDisableThreshold(
  feedId: string,
  threshold: number
): Promise<void> {
  await prisma.feeds.update({
    where: { id: feedId },
    data: { autoDisableThreshold: threshold },
  });
}

/**
 * Enable or disable error notifications for a feed
 */
export async function updateErrorNotifications(
  feedId: string,
  enabled: boolean
): Promise<void> {
  await prisma.feeds.update({
    where: { id: feedId },
    data: { notifyOnError: enabled },
  });
}

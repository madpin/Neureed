import { prisma } from "../db";
import type { user_feeds, feeds } from "@prisma/client";
import type { UserFeedSubscription, FeedWithSubscription } from "@/types/user";
import { assignFeedToCategory } from "./user-category-service";

/**
 * Get all feeds subscribed by a user
 */
export async function getUserFeeds(userId: string): Promise<UserFeedSubscription[]> {
  return await prisma.user_feeds.findMany({
    where: { userId },
    include: { feeds: true },
    orderBy: { subscribedAt: "desc" },
  });
}

/**
 * Subscribe a user to a feed
 * Optionally assign to a category
 */
export async function subscribeFeed(
  userId: string,
  feedId: string,
  customName?: string,
  categoryId?: string
): Promise<user_feeds> {
  const userFeed = await prisma.user_feeds.create({
    data: {
      id: `uf_${userId}_${feedId}_${Date.now()}`,
      userId,
      feedId,
      customName,
      updatedAt: new Date(),
    },
  });

  // If categoryId provided, assign to category
  if (categoryId) {
    await assignFeedToCategory(userId, userFeed.id, categoryId);
  }

  return userFeed;
}

/**
 * Unsubscribe a user from a feed
 */
export async function unsubscribeFeed(userId: string, feedId: string): Promise<void> {
  await prisma.user_feeds.delete({
    where: {
      userId_feedId: {
        userId,
        feedId,
      },
    },
  });
}

/**
 * Update feed subscription settings
 */
export async function updateFeedSettings(
  userId: string,
  feedId: string,
  data: {
    customName?: string;
    settings?: Record<string, unknown>;
  }
): Promise<user_feeds> {
  return await prisma.user_feeds.update({
    where: {
      userId_feedId: {
        userId,
        feedId,
      },
    },
    data: {
      customName: data.customName,
      settings: data.settings as any,
    },
  });
}

/**
 * Check if a user is subscribed to a feed
 */
export async function isUserSubscribed(userId: string, feedId: string): Promise<boolean> {
  const subscription = await prisma.user_feeds.findUnique({
    where: {
      userId_feedId: {
        userId,
        feedId,
      },
    },
  });
  return !!subscription;
}

/**
 * Get all feeds with subscription status for a user
 */
export async function getAllFeedsWithSubscriptionStatus(
  userId: string
): Promise<FeedWithSubscription[]> {
  const feeds = await prisma.feeds.findMany({
    include: {
      user_feeds: {
        where: { userId },
      },
    },
    orderBy: { name: "asc" },
  });

  return feeds.map((feed) => ({
    ...feed,
    isSubscribed: feed.user_feeds.length > 0,
    subscription: feed.user_feeds[0] || undefined,
    user_feeds: undefined as never, // Remove from type
  }));
}

/**
 * Get feed IDs that a user is subscribed to
 */
export async function getUserFeedIds(userId: string): Promise<string[]> {
  const subscriptions = await prisma.user_feeds.findMany({
    where: { userId },
    select: { feedId: true },
  });
  return subscriptions.map((sub) => sub.feedId);
}


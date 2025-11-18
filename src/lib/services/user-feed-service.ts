import { prisma } from "../db";
import type { UserFeed, Feed } from "@prisma/client";
import type { UserFeedSubscription, FeedWithSubscription } from "@/src/types/user";

/**
 * Get all feeds subscribed by a user
 */
export async function getUserFeeds(userId: string): Promise<UserFeedSubscription[]> {
  return await prisma.userFeed.findMany({
    where: { userId },
    include: { feed: true },
    orderBy: { subscribedAt: "desc" },
  });
}

/**
 * Subscribe a user to a feed
 */
export async function subscribeFeed(
  userId: string,
  feedId: string,
  customName?: string
): Promise<UserFeed> {
  return await prisma.userFeed.create({
    data: {
      userId,
      feedId,
      customName,
    },
  });
}

/**
 * Unsubscribe a user from a feed
 */
export async function unsubscribeFeed(userId: string, feedId: string): Promise<void> {
  await prisma.userFeed.delete({
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
): Promise<UserFeed> {
  return await prisma.userFeed.update({
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
  const subscription = await prisma.userFeed.findUnique({
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
  const feeds = await prisma.feed.findMany({
    include: {
      userFeeds: {
        where: { userId },
      },
    },
    orderBy: { name: "asc" },
  });

  return feeds.map((feed) => ({
    ...feed,
    isSubscribed: feed.userFeeds.length > 0,
    subscription: feed.userFeeds[0] || undefined,
    userFeeds: undefined as never, // Remove from type
  }));
}

/**
 * Get feed IDs that a user is subscribed to
 */
export async function getUserFeedIds(userId: string): Promise<string[]> {
  const subscriptions = await prisma.userFeed.findMany({
    where: { userId },
    select: { feedId: true },
  });
  return subscriptions.map((sub) => sub.feedId);
}


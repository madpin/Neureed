import { prisma } from "@/lib/db";
import { parseFeedUrl, validateFeedUrl, normalizeFeedUrl, isSafeFeedUrl } from "@/lib/feed-parser";
import type { feeds, Prisma } from "@/generated/prisma/client";

/**
 * Input types for feed operations
 */
export interface CreateFeedInput {
  name: string;
  url: string;
  description?: string;
  siteUrl?: string;
  imageUrl?: string;
  categoryIds?: string[];
  fetchInterval?: number;
}

export interface UpdateFeedInput {
  name?: string;
  description?: string;
  siteUrl?: string;
  imageUrl?: string;
  fetchInterval?: number;
  settings?: Prisma.JsonValue;
}

export interface PaginationOptions {
  page?: number;
  limit?: number;
}

export interface FeedWithStats extends feeds {
  articleCount: number;
  unreadCount?: number;
}

/**
 * Create a new feed
 */
export async function createFeed(data: CreateFeedInput): Promise<feeds> {
  // Normalize and validate URL
  const normalizedUrl = normalizeFeedUrl(data.url);
  
  if (!isSafeFeedUrl(normalizedUrl)) {
    throw new Error("Invalid or unsafe feed URL");
  }

  // Check if feed already exists
  const existing = await prisma.feeds.findUnique({
    where: { url: normalizedUrl },
  });

  if (existing) {
    throw new Error("Feed already exists");
  }

  // Create feed
  const feed = await prisma.feeds.create({
    data: {
      id: `feed_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      name: data.name,
      url: normalizedUrl,
      description: data.description,
      siteUrl: data.siteUrl,
      imageUrl: data.imageUrl,
      fetchInterval: data.fetchInterval || 60,
      updatedAt: new Date(),
      feed_categories: data.categoryIds
        ? {
            create: data.categoryIds.map((categoryId) => ({
              categoryId,
            })),
          }
        : undefined,
    },
    include: {
      feed_categories: {
        include: {
          categories: true,
        },
      },
    },
  });

  return feed;
}

/**
 * Validate and create feed from URL
 * Automatically fetches feed metadata
 */
export async function validateAndCreateFeed(
  url: string,
  name?: string,
  categoryIds?: string[]
): Promise<feeds> {
  // Normalize URL
  const normalizedUrl = normalizeFeedUrl(url);

  // Security check
  if (!isSafeFeedUrl(normalizedUrl)) {
    throw new Error("Invalid or unsafe feed URL");
  }

  // Validate feed
  const isValid = await validateFeedUrl(normalizedUrl);
  if (!isValid) {
    throw new Error("Invalid feed URL or unable to parse feed");
  }

  // Parse feed to get metadata
  const parsedFeed = await parseFeedUrl(normalizedUrl);

  // Ensure imageUrl is a string (handle array case)
  let imageUrl = parsedFeed.imageUrl;
  if (Array.isArray(imageUrl)) {
    imageUrl = imageUrl[0];
  }

  // Create feed with metadata
  return createFeed({
    name: name || parsedFeed.title,
    url: normalizedUrl,
    description: parsedFeed.description,
    siteUrl: parsedFeed.link,
    imageUrl: imageUrl,
    categoryIds,
  });
}

/**
 * Get a single feed by ID
 */
export async function getFeed(id: string): Promise<feeds | null> {
  return prisma.feeds.findUnique({
    where: { id },
    include: {
      feed_categories: {
        include: {
          categories: true,
        },
      },
    },
  });
}

/**
 * Get a feed by URL
 */
export async function getFeedByUrl(url: string): Promise<feeds | null> {
  const normalizedUrl = normalizeFeedUrl(url);
  return prisma.feeds.findUnique({
    where: { url: normalizedUrl },
  });
}

/**
 * Get all feeds with pagination
 */
export async function getAllFeeds(
  options: PaginationOptions = {}
): Promise<{ feeds: FeedWithStats[]; total: number }> {
  const page = options.page || 1;
  const limit = options.limit || 50;
  const skip = (page - 1) * limit;

  const [feeds, total] = await Promise.all([
    prisma.feeds.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        feed_categories: {
          include: {
            categories: true,
          },
        },
        _count: {
          select: {
            articles: true,
          },
        },
      },
    }),
    prisma.feeds.count(),
  ]);

  const feedsWithStats: FeedWithStats[] = feeds.map((feed) => ({
    ...feed,
    articleCount: feed._count.articles,
    _count: undefined,
  } as FeedWithStats));

  return { feeds: feedsWithStats, total };
}

/**
 * Get feeds by category
 */
export async function getFeedsByCategory(categoryId: string): Promise<feeds[]> {
  return prisma.feeds.findMany({
    where: {
      feed_categories: {
        some: {
          categoryId,
        },
      },
    },
    include: {
      feed_categories: {
        include: {
          categories: true,
        },
      },
    },
    orderBy: { name: "asc" },
  });
}

/**
 * Search feeds by name or description
 */
export async function searchFeeds(query: string): Promise<feeds[]> {
  return prisma.feeds.findMany({
    where: {
      OR: [
        { name: { contains: query, mode: "insensitive" } },
        { description: { contains: query, mode: "insensitive" } },
        { url: { contains: query, mode: "insensitive" } },
      ],
    },
    include: {
      feed_categories: {
        include: {
          categories: true,
        },
      },
    },
    orderBy: { name: "asc" },
  });
}

/**
 * Update a feed
 */
export async function updateFeed(
  id: string,
  data: UpdateFeedInput
): Promise<feeds> {
  return prisma.feeds.update({
    where: { id },
    data: {
      name: data.name,
      description: data.description,
      siteUrl: data.siteUrl,
      imageUrl: data.imageUrl,
      fetchInterval: data.fetchInterval,
      settings: data.settings as any,
    },
    include: {
      feed_categories: {
        include: {
          categories: true,
        },
      },
    },
  });
}

/**
 * Update feed metadata from parsed feed
 */
export async function updateFeedMetadata(
  id: string,
  metadata: {
    title?: string;
    description?: string;
    link?: string;
    imageUrl?: string;
  }
): Promise<feeds> {
  return prisma.feeds.update({
    where: { id },
    data: {
      name: metadata.title,
      description: metadata.description,
      siteUrl: metadata.link,
      imageUrl: metadata.imageUrl,
    },
  });
}

/**
 * Record a feed error
 */
export async function recordFeedError(
  id: string,
  error: string
): Promise<void> {
  await prisma.feeds.update({
    where: { id },
    data: {
      errorCount: { increment: 1 },
      lastError: error,
    },
  });
}

/**
 * Clear feed error
 */
export async function clearFeedError(id: string): Promise<void> {
  await prisma.feeds.update({
    where: { id },
    data: {
      errorCount: 0,
      lastError: null,
    },
  });
}

/**
 * Update feed last fetched time
 */
export async function updateFeedLastFetched(
  id: string,
  etag?: string,
  lastModified?: string
): Promise<void> {
  await prisma.feeds.update({
    where: { id },
    data: {
      lastFetched: new Date(),
      etag: etag || undefined,
      lastModified: lastModified || undefined,
    },
  });
}

/**
 * Delete a feed
 */
export async function deleteFeed(id: string): Promise<void> {
  await prisma.feeds.delete({
    where: { id },
  });
}

/**
 * Delete a feed with all its articles
 * (Cascade delete is handled by Prisma schema)
 */
export async function deleteFeedWithArticles(id: string): Promise<void> {
  await prisma.feeds.delete({
    where: { id },
  });
}

/**
 * Get feeds that need to be refreshed (system-wide)
 */
export async function getFeedsToRefresh(): Promise<feeds[]> {
  const now = new Date();

  return prisma.feeds.findMany({
    where: {
      OR: [
        // Never fetched
        { lastFetched: null },
        // Fetched but interval has passed
        {
          lastFetched: {
            lt: new Date(now.getTime() - 60 * 60 * 1000), // 1 hour ago (default)
          },
        },
      ],
      // Don't retry feeds with too many errors
      errorCount: {
        lt: 10,
      },
    },
    orderBy: {
      lastFetched: "asc",
    },
  });
}

/**
 * Get feeds that need to be refreshed for a specific user
 * Uses user's configured refresh intervals (cascading from feed → category → user preferences)
 */
export async function getUserFeedsToRefresh(userId: string): Promise<
  Array<{
    feeds: feeds;
    userFeedId: string;
    refreshInterval: number;
  }>
> {
  const now = new Date();

  // Get all user's subscribed feeds
  const userFeeds = await prisma.user_feeds.findMany({
    where: { userId },
    include: {
      feeds: true,
      user_feed_categories: {
        include: {
          user_categories: true,
        },
      },
    },
  });

  // Get user preferences for defaults
  const userPreferences = await prisma.user_preferences.findUnique({
    where: { userId },
  });

  const defaultRefreshInterval =
    userPreferences?.defaultRefreshInterval || 60;

  const feedsToRefresh: Array<{
    feeds: feeds;
    userFeedId: string;
    refreshInterval: number;
  }> = [];

  for (const userFeed of userFeeds) {
    // Skip feeds with too many errors
    if (userFeed.feeds.errorCount >= 10) {
      continue;
    }

    // Determine effective refresh interval using cascade logic
    let refreshInterval = defaultRefreshInterval;

    // Check category settings (if feed is in a category)
    if (userFeed.user_feed_categories.length > 0) {
      const categorySettings = userFeed.user_feed_categories[0].user_categories
        .settings as any;
      if (
        categorySettings?.refreshInterval !== undefined &&
        categorySettings?.refreshInterval !== null
      ) {
        refreshInterval = categorySettings.refreshInterval;
      }
    }

    // Check feed-specific settings (highest priority)
    const feedSettings = userFeed.settings as any;
    if (
      feedSettings?.refreshInterval !== undefined &&
      feedSettings?.refreshInterval !== null
    ) {
      refreshInterval = feedSettings.refreshInterval;
    }

    // Check if feed needs refresh
    const lastFetched = userFeed.feeds.lastFetched;
    const refreshIntervalMs = refreshInterval * 60 * 1000;

    if (
      !lastFetched ||
      now.getTime() - lastFetched.getTime() >= refreshIntervalMs
    ) {
      feedsToRefresh.push({
        feeds: userFeed.feeds,
        userFeedId: userFeed.id,
        refreshInterval,
      });
    }
  }

  return feedsToRefresh;
}

/**
 * Get feed statistics
 */
export async function getFeedStats(feedId: string): Promise<{
  totalArticles: number;
  articlesThisWeek: number;
  articlesThisMonth: number;
  lastArticleDate?: Date;
}> {
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const oneMonthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [totalArticles, articlesThisWeek, articlesThisMonth, lastArticle] =
    await Promise.all([
      prisma.articles.count({
        where: { feedId },
      }),
      prisma.articles.count({
        where: {
          feedId,
          createdAt: { gte: oneWeekAgo },
        },
      }),
      prisma.articles.count({
        where: {
          feedId,
          createdAt: { gte: oneMonthAgo },
        },
      }),
      prisma.articles.findFirst({
        where: { feedId },
        orderBy: { publishedAt: "desc" },
        select: { publishedAt: true },
      }),
    ]);

  return {
    totalArticles,
    articlesThisWeek,
    articlesThisMonth,
    lastArticleDate: lastArticle?.publishedAt || undefined,
  };
}

/**
 * Update feed categories
 */
export async function updateFeedCategories(
  feedId: string,
  categoryIds: string[]
): Promise<void> {
  // Delete existing categories
  await prisma.feed_categories.deleteMany({
    where: { feedId },
  });

  // Create new categories
  if (categoryIds.length > 0) {
    await prisma.feed_categories.createMany({
      data: categoryIds.map((categoryId) => ({
        feedId,
        categoryId,
      })),
    });
  }
}


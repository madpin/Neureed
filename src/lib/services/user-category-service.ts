import { prisma } from "@/lib/db";
import type { user_categories, user_feed_categories, feeds } from "@/generated/prisma/client";

export interface UserCategoryWithFeeds extends user_categories {
  feedCount: number;
  feeds?: Array<{
    id: string;
    name: string;
    imageUrl: string | null;
    userFeedId: string;
  }>;
}

export interface FeedsGroupedByCategory {
  categories: UserCategoryWithFeeds[];
  uncategorized: Array<{
    id: string;
    name: string;
    imageUrl: string | null;
    userFeedId: string;
    feedId: string;
  }>;
}

/**
 * Get all user categories with feed counts
 */
export async function getUserCategories(
  userId: string
): Promise<UserCategoryWithFeeds[]> {
  const categories = await prisma.user_categories.findMany({
    where: { userId },
    orderBy: { order: "asc" },
    include: {
      _count: {
        select: {
          user_feed_categories: true,
        },
      },
    },
  });

  return categories.map((cat) => ({
    ...cat,
    feedCount: cat._count.user_feed_categories,
    _count: undefined as never,
  }));
}

/**
 * Get a specific user category
 */
export async function getUserCategory(
  userId: string,
  categoryId: string
): Promise<any | null> {
  const category = await prisma.user_categories.findFirst({
    where: {
      id: categoryId,
      userId,
    },
    include: {
      user_feed_categories: {
        include: {
          user_feeds: {
            include: {
              feeds: {
                select: {
                  id: true,
                  name: true,
                  imageUrl: true,
                  lastFetched: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!category) return null;

  // Get feed IDs for unread count calculation
  const feedIds = category.user_feed_categories.map((ufc) => ufc.user_feeds.feeds.id);

  // Get unread article counts for feeds in this category
  const unreadCounts = feedIds.length > 0
    ? await prisma.articles.groupBy({
        by: ['feedId'],
        where: {
          feedId: { in: feedIds },
          read_articles: {
            none: {
              userId: userId,
            },
          },
        },
        _count: {
          id: true,
        },
      })
    : [];

  // Create a map of feedId -> unread count
  const unreadCountMap = new Map(
    unreadCounts.map((item) => [item.feedId, item._count.id])
  );

  // Transform to include feeds array
  return {
    ...category,
    feeds: category.user_feed_categories.map((ufc) => ({
      id: ufc.user_feeds.feeds.id,
      name: ufc.user_feeds.customName || ufc.user_feeds.feeds.name,
      imageUrl: ufc.user_feeds.feeds.imageUrl,
      userFeedId: ufc.user_feeds.id,
      lastFetched: ufc.user_feeds.feeds.lastFetched,
      articleCount: unreadCountMap.get(ufc.user_feeds.feeds.id) || 0,
    })),
  };
}

/**
 * Get user category by name
 */
export async function getUserCategoryByName(
  userId: string,
  name: string
): Promise<user_categories | null> {
  return prisma.user_categories.findFirst({
    where: {
      userId,
      name: {
        equals: name,
        mode: "insensitive",
      },
    },
  });
}

/**
 * Create a new user category
 */
export async function createUserCategory(
  userId: string,
  name: string,
  description?: string,
  settings?: Record<string, any>,
  icon?: string
): Promise<user_categories> {
  // Check if category already exists for this user
  const existing = await getUserCategoryByName(userId, name);
  if (existing) {
    throw new Error(`Category "${name}" already exists`);
  }

  // Get the highest order number and add 1
  const highestOrder = await prisma.user_categories.findFirst({
    where: { userId },
    orderBy: { order: "desc" },
    select: { order: true },
  });

  const order = (highestOrder?.order ?? -1) + 1;

  return prisma.user_categories.create({
    data: {
      id: `cat_${userId}_${Date.now()}`,
      userId,
      name: name.trim(),
      description: description?.trim(),
      settings,
      icon: icon || "📁",
      order,
      updatedAt: new Date(),
    },
  });
}

/**
 * Update a user category
 */
export async function updateUserCategory(
  userId: string,
  categoryId: string,
  data: {
    name?: string;
    description?: string;
    settings?: Record<string, any>;
    icon?: string;
  }
): Promise<user_categories> {
  // Verify ownership
  const category = await getUserCategory(userId, categoryId);
  if (!category) {
    throw new Error("Category not found");
  }

  // If updating name, check for duplicates
  if (data.name && data.name !== category.name) {
    const existing = await getUserCategoryByName(userId, data.name);
    if (existing && existing.id !== categoryId) {
      throw new Error(`Category "${data.name}" already exists`);
    }
  }

  return prisma.user_categories.update({
    where: { id: categoryId },
    data: {
      name: data.name?.trim(),
      description: data.description?.trim(),
      settings: data.settings,
      icon: data.icon,
    },
  });
}

/**
 * Delete a user category
 * This will unassign all feeds from the category (they become uncategorized)
 */
export async function deleteUserCategory(
  userId: string,
  categoryId: string
): Promise<void> {
  // Verify ownership
  const category = await getUserCategory(userId, categoryId);
  if (!category) {
    throw new Error("Category not found");
  }

  // Delete the category (cascade will remove UserFeedCategory entries)
  await prisma.user_categories.delete({
    where: { id: categoryId },
  });
}

/**
 * Reorder categories
 */
export async function reorderUserCategories(
  userId: string,
  categoryIds: string[]
): Promise<void> {
  // Verify all categories belong to the user
  const categories = await prisma.user_categories.findMany({
    where: {
      userId,
      id: { in: categoryIds },
    },
  });

  if (categories.length !== categoryIds.length) {
    throw new Error("One or more categories not found");
  }

  // Update orders in a transaction
  await prisma.$transaction(
    categoryIds.map((id, index) =>
      prisma.user_categories.update({
        where: { id },
        data: { order: index },
      })
    )
  );
}

/**
 * Assign a user feed to a category
 */
export async function assignFeedToCategory(
  userId: string,
  userFeedId: string,
  categoryId: string
): Promise<user_feed_categories> {
  // Verify the user owns the feed
  const userFeed = await prisma.user_feeds.findFirst({
    where: {
      id: userFeedId,
      userId,
    },
  });

  if (!userFeed) {
    throw new Error("Feed not found");
  }

  // Verify the user owns the category
  const category = await getUserCategory(userId, categoryId);
  if (!category) {
    throw new Error("Category not found");
  }

  // Check if already assigned
  const existing = await prisma.user_feed_categories.findFirst({
    where: {
      userFeedId,
      userCategoryId: categoryId,
    },
  });

  if (existing) {
    return existing;
  }

  // Create the assignment
  return prisma.user_feed_categories.create({
    data: {
      id: `ufc_${userFeedId}_${categoryId}`,
      userFeedId,
      userCategoryId: categoryId,
    },
  });
}

/**
 * Unassign a user feed from a category
 */
export async function unassignFeedFromCategory(
  userId: string,
  userFeedId: string,
  categoryId: string
): Promise<void> {
  // Verify the user owns the feed
  const userFeed = await prisma.user_feeds.findFirst({
    where: {
      id: userFeedId,
      userId,
    },
  });

  if (!userFeed) {
    throw new Error("Feed not found");
  }

  // Delete the assignment
  await prisma.user_feed_categories.deleteMany({
    where: {
      userFeedId,
      userCategoryId: categoryId,
    },
  });
}

/**
 * Unassign a feed from all categories
 */
export async function unassignFeedFromAllCategories(
  userId: string,
  userFeedId: string
): Promise<void> {
  // Verify the user owns the feed
  const userFeed = await prisma.user_feeds.findFirst({
    where: {
      id: userFeedId,
      userId,
    },
  });

  if (!userFeed) {
    throw new Error("Feed not found");
  }

  await prisma.user_feed_categories.deleteMany({
    where: { userFeedId },
  });
}

/**
 * Get feeds grouped by categories
 * Returns categories with their feeds and uncategorized feeds
 */
export async function getFeedsGroupedByCategory(
  userId: string
): Promise<FeedsGroupedByCategory> {
  // Get all user categories
  const categories = await prisma.user_categories.findMany({
    where: { userId },
    orderBy: { order: "asc" },
    include: {
      user_feed_categories: {
        include: {
          user_feeds: {
            include: {
              feeds: {
                select: {
                  id: true,
                  name: true,
                  imageUrl: true,
                  lastFetched: true,
                },
              },
            },
          },
        },
      },
    },
  });

  // Get all user feeds
  const allUserFeeds = await prisma.user_feeds.findMany({
    where: { userId },
    include: {
      feeds: {
        select: {
          id: true,
          name: true,
          imageUrl: true,
          lastFetched: true,
        },
      },
      user_feed_categories: {
        select: {
          id: true,
        },
      },
    },
  });

  // Get all feed IDs to calculate unread counts
  const feedIds = allUserFeeds.map((uf) => uf.feeds.id);

  // Get unread article counts for all feeds in a single query
  const unreadCounts = feedIds.length > 0 
    ? await prisma.articles.groupBy({
        by: ['feedId'],
        where: {
          feedId: { in: feedIds },
          read_articles: {
            none: {
              userId: userId,
            },
          },
        },
        _count: {
          id: true,
        },
      })
    : [];

  // Create a map of feedId -> unread count
  const unreadCountMap = new Map(
    unreadCounts.map((item) => [item.feedId, item._count.id])
  );

  // Find uncategorized feeds (feeds with no category assignments)
  const uncategorizedFeeds = allUserFeeds
    .filter((uf) => uf.user_feed_categories.length === 0)
    .map((uf) => ({
      id: uf.feeds.id,
      name: uf.customName || uf.feeds.name,
      imageUrl: uf.feeds.imageUrl,
      userFeedId: uf.id,
      feedId: uf.feeds.id,
      lastFetched: uf.feeds.lastFetched,
      articleCount: unreadCountMap.get(uf.feeds.id) || 0,
    }));

  // Map categories with their feeds
  const categoriesWithFeeds: UserCategoryWithFeeds[] = categories.map(
    (cat) => ({
      id: cat.id,
      userId: cat.userId,
      name: cat.name,
      description: cat.description,
      icon: cat.icon,
      order: cat.order,
      settings: cat.settings,
      createdAt: cat.createdAt,
      updatedAt: cat.updatedAt,
      feedCount: cat.user_feed_categories.length,
      feeds: cat.user_feed_categories.map((ufc) => ({
        id: ufc.user_feeds.feeds.id,
        name: ufc.user_feeds.customName || ufc.user_feeds.feeds.name,
        imageUrl: ufc.user_feeds.feeds.imageUrl,
        userFeedId: ufc.user_feeds.id,
        lastFetched: ufc.user_feeds.feeds.lastFetched,
        articleCount: unreadCountMap.get(ufc.user_feeds.feeds.id) || 0,
      })),
    })
  );

  return {
    categories: categoriesWithFeeds,
    uncategorized: uncategorizedFeeds,
  };
}

/**
 * Get feeds in a specific category
 */
export async function getCategoryFeeds(userId: string, categoryId: string) {
  // Verify ownership
  const category = await getUserCategory(userId, categoryId);
  if (!category) {
    throw new Error("Category not found");
  }

  const categoryWithFeeds = await prisma.user_categories.findUnique({
    where: { id: categoryId },
    include: {
      user_feed_categories: {
        include: {
          user_feeds: {
            include: {
              feeds: true,
            },
          },
        },
      },
    },
  });

  if (!categoryWithFeeds) {
    return null;
  }

  return {
    ...category,
    feeds: categoryWithFeeds.user_feed_categories.map((ufc) => ({
      ...ufc.user_feeds.feeds,
      userFeedId: ufc.user_feeds.id,
      customName: ufc.user_feeds.customName,
    })),
  };
}

/**
 * Get merged settings for a feed (category settings + feed settings)
 * Category settings serve as defaults, feed-specific settings override
 */
export async function getFeedEffectiveSettings(
  userId: string,
  userFeedId: string
): Promise<Record<string, any>> {
  const userFeed = await prisma.user_feeds.findFirst({
    where: {
      id: userFeedId,
      userId,
    },
    include: {
      user_feed_categories: {
        include: {
          user_categories: true,
        },
      },
    },
  });

  if (!userFeed) {
    return {};
  }

  // Start with default settings
  let effectiveSettings: Record<string, any> = {};

  // Apply category settings (if feed is in a category)
  if (userFeed.user_feed_categories.length > 0) {
    const categorySettings = userFeed.user_feed_categories[0].user_categories
      .settings as Record<string, any> | null;
    if (categorySettings) {
      effectiveSettings = { ...effectiveSettings, ...categorySettings };
    }
  }

  // Apply feed-specific settings (override category settings)
  if (userFeed.settings) {
    effectiveSettings = {
      ...effectiveSettings,
      ...(userFeed.settings as Record<string, any>),
    };
  }

  return effectiveSettings;
}


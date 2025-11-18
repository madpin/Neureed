import { prisma } from "@/src/lib/db";
import type { UserCategory, UserFeedCategory, Feed } from "@prisma/client";

export interface UserCategoryWithFeeds extends UserCategory {
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
  const categories = await prisma.userCategory.findMany({
    where: { userId },
    orderBy: { order: "asc" },
    include: {
      _count: {
        select: {
          userFeedCategories: true,
        },
      },
    },
  });

  return categories.map((cat) => ({
    ...cat,
    feedCount: cat._count.userFeedCategories,
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
  const category = await prisma.userCategory.findFirst({
    where: {
      id: categoryId,
      userId,
    },
    include: {
      userFeedCategories: {
        include: {
          userFeed: {
            include: {
              feed: {
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
  const feedIds = category.userFeedCategories.map((ufc) => ufc.userFeed.feed.id);

  // Get unread article counts for feeds in this category
  const unreadCounts = feedIds.length > 0
    ? await prisma.article.groupBy({
        by: ['feedId'],
        where: {
          feedId: { in: feedIds },
          readArticles: {
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
    feeds: category.userFeedCategories.map((ufc) => ({
      id: ufc.userFeed.feed.id,
      name: ufc.userFeed.customName || ufc.userFeed.feed.name,
      imageUrl: ufc.userFeed.feed.imageUrl,
      userFeedId: ufc.userFeed.id,
      lastFetched: ufc.userFeed.feed.lastFetched,
      articleCount: unreadCountMap.get(ufc.userFeed.feed.id) || 0,
    })),
  };
}

/**
 * Get user category by name
 */
export async function getUserCategoryByName(
  userId: string,
  name: string
): Promise<UserCategory | null> {
  return prisma.userCategory.findFirst({
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
): Promise<UserCategory> {
  // Check if category already exists for this user
  const existing = await getUserCategoryByName(userId, name);
  if (existing) {
    throw new Error(`Category "${name}" already exists`);
  }

  // Get the highest order number and add 1
  const highestOrder = await prisma.userCategory.findFirst({
    where: { userId },
    orderBy: { order: "desc" },
    select: { order: true },
  });

  const order = (highestOrder?.order ?? -1) + 1;

  return prisma.userCategory.create({
    data: {
      userId,
      name: name.trim(),
      description: description?.trim(),
      settings,
      icon: icon || "📁",
      order,
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
): Promise<UserCategory> {
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

  return prisma.userCategory.update({
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
  await prisma.userCategory.delete({
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
  const categories = await prisma.userCategory.findMany({
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
      prisma.userCategory.update({
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
): Promise<UserFeedCategory> {
  // Verify the user owns the feed
  const userFeed = await prisma.userFeed.findFirst({
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
  const existing = await prisma.userFeedCategory.findFirst({
    where: {
      userFeedId,
      userCategoryId: categoryId,
    },
  });

  if (existing) {
    return existing;
  }

  // Create the assignment
  return prisma.userFeedCategory.create({
    data: {
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
  const userFeed = await prisma.userFeed.findFirst({
    where: {
      id: userFeedId,
      userId,
    },
  });

  if (!userFeed) {
    throw new Error("Feed not found");
  }

  // Delete the assignment
  await prisma.userFeedCategory.deleteMany({
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
  const userFeed = await prisma.userFeed.findFirst({
    where: {
      id: userFeedId,
      userId,
    },
  });

  if (!userFeed) {
    throw new Error("Feed not found");
  }

  await prisma.userFeedCategory.deleteMany({
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
  const categories = await prisma.userCategory.findMany({
    where: { userId },
    orderBy: { order: "asc" },
    include: {
      userFeedCategories: {
        include: {
          userFeed: {
            include: {
              feed: {
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
  const allUserFeeds = await prisma.userFeed.findMany({
    where: { userId },
    include: {
      feed: {
        select: {
          id: true,
          name: true,
          imageUrl: true,
          lastFetched: true,
        },
      },
      userFeedCategories: {
        select: {
          id: true,
        },
      },
    },
  });

  // Get all feed IDs to calculate unread counts
  const feedIds = allUserFeeds.map((uf) => uf.feed.id);

  // Get unread article counts for all feeds in a single query
  const unreadCounts = feedIds.length > 0 
    ? await prisma.article.groupBy({
        by: ['feedId'],
        where: {
          feedId: { in: feedIds },
          readArticles: {
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
    .filter((uf) => uf.userFeedCategories.length === 0)
    .map((uf) => ({
      id: uf.feed.id,
      name: uf.customName || uf.feed.name,
      imageUrl: uf.feed.imageUrl,
      userFeedId: uf.id,
      feedId: uf.feed.id,
      lastFetched: uf.feed.lastFetched,
      articleCount: unreadCountMap.get(uf.feed.id) || 0,
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
      feedCount: cat.userFeedCategories.length,
      feeds: cat.userFeedCategories.map((ufc) => ({
        id: ufc.userFeed.feed.id,
        name: ufc.userFeed.customName || ufc.userFeed.feed.name,
        imageUrl: ufc.userFeed.feed.imageUrl,
        userFeedId: ufc.userFeed.id,
        lastFetched: ufc.userFeed.feed.lastFetched,
        articleCount: unreadCountMap.get(ufc.userFeed.feed.id) || 0,
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

  const categoryWithFeeds = await prisma.userCategory.findUnique({
    where: { id: categoryId },
    include: {
      userFeedCategories: {
        include: {
          userFeed: {
            include: {
              feed: true,
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
    feeds: categoryWithFeeds.userFeedCategories.map((ufc) => ({
      ...ufc.userFeed.feed,
      userFeedId: ufc.userFeed.id,
      customName: ufc.userFeed.customName,
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
  const userFeed = await prisma.userFeed.findFirst({
    where: {
      id: userFeedId,
      userId,
    },
    include: {
      userFeedCategories: {
        include: {
          userCategory: true,
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
  if (userFeed.userFeedCategories.length > 0) {
    const categorySettings = userFeed.userFeedCategories[0].userCategory
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


import { prisma } from "@/lib/db";

/**
 * Bulk Operations Service
 *
 * Handles bulk operations on feeds and categories
 */

export interface BulkUpdateResult {
  success: boolean;
  updatedCount: number;
  failedIds: string[];
  errors: string[];
}

/**
 * Bulk update feed category
 */
export async function bulkUpdateFeedCategory(
  userId: string,
  feedIds: string[],
  categoryId: string | null
): Promise<BulkUpdateResult> {
  const errors: string[] = [];
  const failedIds: string[] = [];
  let updatedCount = 0;

  try {
    // Verify user owns all feeds
    const userFeeds = await prisma.user_feeds.findMany({
      where: {
        userId,
        feedId: { in: feedIds },
      },
    });

    if (userFeeds.length !== feedIds.length) {
      return {
        success: false,
        updatedCount: 0,
        failedIds: feedIds,
        errors: ["Not all feeds belong to this user"],
      };
    }

    // If categoryId is provided, verify it exists and belongs to user
    if (categoryId) {
      const category = await prisma.user_categories.findFirst({
        where: { id: categoryId, userId },
      });

      if (!category) {
        return {
          success: false,
          updatedCount: 0,
          failedIds: feedIds,
          errors: ["Category not found or does not belong to user"],
        };
      }
    }

    // Update feed categories
    for (const userFeed of userFeeds) {
      try {
        // Remove existing category associations
        await prisma.user_feed_categories.deleteMany({
          where: { userFeedId: userFeed.id },
        });

        // Add new category association if provided
        if (categoryId) {
          await prisma.user_feed_categories.create({
            data: {
              id: `ufc_${userFeed.id}_${categoryId}`,
              userFeedId: userFeed.id,
              userCategoryId: categoryId,
            },
          });
        }

        updatedCount++;
      } catch (error) {
        failedIds.push(userFeed.feedId);
        errors.push(`Failed to update feed ${userFeed.feedId}: ${error}`);
      }
    }

    return {
      success: failedIds.length === 0,
      updatedCount,
      failedIds,
      errors,
    };
  } catch (error) {
    return {
      success: false,
      updatedCount: 0,
      failedIds: feedIds,
      errors: [`Bulk update failed: ${error}`],
    };
  }
}

/**
 * Bulk update feed tags
 */
export async function bulkUpdateFeedTags(
  userId: string,
  feedIds: string[],
  action: "add" | "remove" | "replace",
  tags: string[]
): Promise<BulkUpdateResult> {
  const errors: string[] = [];
  const failedIds: string[] = [];
  let updatedCount = 0;

  try {
    // Verify user owns all feeds
    const userFeeds = await prisma.user_feeds.findMany({
      where: {
        userId,
        feedId: { in: feedIds },
      },
    });

    if (userFeeds.length !== feedIds.length) {
      return {
        success: false,
        updatedCount: 0,
        failedIds: feedIds,
        errors: ["Not all feeds belong to this user"],
      };
    }

    // Update tags for each feed
    for (const userFeed of userFeeds) {
      try {
        let newTags: string[];

        switch (action) {
          case "add":
            const existingTags = userFeed.tags as string[] || [];
            newTags = [...new Set([...existingTags, ...tags])];
            break;
          case "remove":
            newTags = ((userFeed.tags as string[] || []).filter((tag) => !tags.includes(tag)));
            break;
          case "replace":
            newTags = tags;
            break;
        }

        await prisma.user_feeds.update({
          where: { id: userFeed.id },
          data: { tags: newTags },
        });

        updatedCount++;
      } catch (error) {
        failedIds.push(userFeed.feedId);
        errors.push(`Failed to update tags for feed ${userFeed.feedId}: ${error}`);
      }
    }

    return {
      success: failedIds.length === 0,
      updatedCount,
      failedIds,
      errors,
    };
  } catch (error) {
    return {
      success: false,
      updatedCount: 0,
      failedIds: feedIds,
      errors: [`Bulk tag update failed: ${error}`],
    };
  }
}

/**
 * Bulk update feed settings
 */
export async function bulkUpdateFeedSettings(
  userId: string,
  feedIds: string[],
  settings: {
    refreshInterval?: number;
    maxArticlesPerFeed?: number;
    maxArticleAge?: number;
  }
): Promise<BulkUpdateResult> {
  const errors: string[] = [];
  const failedIds: string[] = [];
  let updatedCount = 0;

  try {
    // Verify user owns all feeds
    const userFeeds = await prisma.user_feeds.findMany({
      where: {
        userId,
        feedId: { in: feedIds },
      },
      include: { feeds: true },
    });

    if (userFeeds.length !== feedIds.length) {
      return {
        success: false,
        updatedCount: 0,
        failedIds: feedIds,
        errors: ["Not all feeds belong to this user"],
      };
    }

    // Update settings for each feed
    for (const userFeed of userFeeds) {
      try {
        const currentSettings = (userFeed.feeds.settings as any) || {};
        const updatedSettings = {
          ...currentSettings,
          ...settings,
        };

        await prisma.feeds.update({
          where: { id: userFeed.feedId },
          data: { settings: updatedSettings },
        });

        updatedCount++;
      } catch (error) {
        failedIds.push(userFeed.feedId);
        errors.push(`Failed to update settings for feed ${userFeed.feedId}: ${error}`);
      }
    }

    return {
      success: failedIds.length === 0,
      updatedCount,
      failedIds,
      errors,
    };
  } catch (error) {
    return {
      success: false,
      updatedCount: 0,
      failedIds: feedIds,
      errors: [`Bulk settings update failed: ${error}`],
    };
  }
}

/**
 * Bulk delete feeds
 */
export async function bulkDeleteFeeds(
  userId: string,
  feedIds: string[]
): Promise<BulkUpdateResult> {
  const errors: string[] = [];
  const failedIds: string[] = [];
  let updatedCount = 0;

  try {
    // Verify user owns all feeds
    const userFeeds = await prisma.user_feeds.findMany({
      where: {
        userId,
        feedId: { in: feedIds },
      },
    });

    if (userFeeds.length !== feedIds.length) {
      return {
        success: false,
        updatedCount: 0,
        failedIds: feedIds,
        errors: ["Not all feeds belong to this user"],
      };
    }

    // Delete user feed associations
    for (const userFeed of userFeeds) {
      try {
        // Delete user_feed_categories associations
        await prisma.user_feed_categories.deleteMany({
          where: { userFeedId: userFeed.id },
        });

        // Delete user_feed
        await prisma.user_feeds.delete({
          where: { id: userFeed.id },
        });

        updatedCount++;
      } catch (error) {
        failedIds.push(userFeed.feedId);
        errors.push(`Failed to delete feed ${userFeed.feedId}: ${error}`);
      }
    }

    return {
      success: failedIds.length === 0,
      updatedCount,
      failedIds,
      errors,
    };
  } catch (error) {
    return {
      success: false,
      updatedCount: 0,
      failedIds: feedIds,
      errors: [`Bulk delete failed: ${error}`],
    };
  }
}

/**
 * Bulk refresh feeds
 */
export async function bulkRefreshFeeds(
  userId: string,
  feedIds: string[]
): Promise<BulkUpdateResult> {
  // This would typically trigger the feed refresh job
  // For now, we'll just verify ownership and return success
  const userFeeds = await prisma.user_feeds.findMany({
    where: {
      userId,
      feedId: { in: feedIds },
    },
  });

  if (userFeeds.length !== feedIds.length) {
    return {
      success: false,
      updatedCount: 0,
      failedIds: feedIds,
      errors: ["Not all feeds belong to this user"],
    };
  }

  // TODO: Integrate with feed-refresh-service to trigger actual refresh
  return {
    success: true,
    updatedCount: feedIds.length,
    failedIds: [],
    errors: [],
  };
}

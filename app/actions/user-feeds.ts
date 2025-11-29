'use server';

/**
 * Server Actions for User Feed operations
 *
 * These actions replace the following API routes:
 * - GET /api/user/feeds
 * - POST /api/user/feeds
 * - DELETE /api/user/feeds
 * - GET /api/user/feeds/[feedId]/settings
 * - PUT /api/user/feeds/[feedId]/settings
 * - DELETE /api/user/feeds/[feedId]/categories
 */

import { auth } from '@/lib/auth';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import {
  getUserFeeds,
  subscribeFeed,
  unsubscribeFeed,
  getAllFeedsWithSubscriptionStatus,
} from '@/lib/services/user-feed-service';
import {
  getFeedsGroupedByCategory,
  unassignFeedFromAllCategories,
} from '@/lib/services/user-category-service';
import {
  getEffectiveFeedSettings,
  validateFeedSettings,
} from '@/lib/services/feed-settings-cascade';
import { prisma } from '@/lib/db';

// Validation schemas
const getUserFeedsQuerySchema = z.object({
  includeAll: z.boolean().optional(),
  groupByCategory: z.boolean().optional(),
});

const subscribeSchema = z.object({
  feedId: z.string(),
  customName: z.string().optional(),
  categoryId: z.string().optional(),
});

const unsubscribeSchema = z.object({
  feedId: z.string(),
});

const feedSettingsSchema = z.object({
  customName: z.string().optional().nullable(),
  refreshInterval: z.number().min(15).max(1440).optional().nullable(),
  maxArticlesPerFeed: z.number().min(50).max(5000).optional().nullable(),
  maxArticleAge: z.number().min(1).max(365).optional().nullable(),
});

type GetUserFeedsQueryInput = z.infer<typeof getUserFeedsQuerySchema>;
type SubscribeInput = z.infer<typeof subscribeSchema>;
type UnsubscribeInput = z.infer<typeof unsubscribeSchema>;
type FeedSettingsInput = z.infer<typeof feedSettingsSchema>;

/**
 * Get user's subscribed feeds
 * Optionally include all feeds with subscription status or group by category
 */
export async function getUserFeedsAction(input?: GetUserFeedsQueryInput) {
  const session = await auth();

  if (!session?.user) {
    throw new Error('Unauthorized');
  }

  try {
    const validated = getUserFeedsQuerySchema.parse(input || {});
    const { includeAll, groupByCategory } = validated;

    if (groupByCategory) {
      const grouped = await getFeedsGroupedByCategory(session.user.id);
      return grouped;
    } else if (includeAll) {
      const feeds = await getAllFeedsWithSubscriptionStatus(session.user.id);
      return { feeds };
    } else {
      const subscriptions = await getUserFeeds(session.user.id);
      return { subscriptions };
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`Validation error: ${error.issues.map(e => e.message).join(', ')}`);
    }
    throw error;
  }
}

/**
 * Subscribe to a feed
 * Optionally assign to a category and set custom name
 */
export async function subscribeFeedAction(input: SubscribeInput) {
  const session = await auth();

  if (!session?.user) {
    throw new Error('Unauthorized');
  }

  try {
    const validated = subscribeSchema.parse(input);
    const { feedId, customName, categoryId } = validated;

    const subscription = await subscribeFeed(
      session.user.id,
      feedId,
      customName,
      categoryId
    );

    revalidatePath('/');
    revalidatePath('/feeds');

    return { subscription, message: 'Successfully subscribed to feed' };
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`Validation error: ${error.issues.map(e => e.message).join(', ')}`);
    }
    throw error;
  }
}

/**
 * Unsubscribe from a feed
 */
export async function unsubscribeFeedAction(input: UnsubscribeInput) {
  const session = await auth();

  if (!session?.user) {
    throw new Error('Unauthorized');
  }

  try {
    const validated = unsubscribeSchema.parse(input);
    const { feedId } = validated;

    await unsubscribeFeed(session.user.id, feedId);

    revalidatePath('/');
    revalidatePath('/feeds');

    return { message: 'Successfully unsubscribed from feed' };
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`Validation error: ${error.issues.map(e => e.message).join(', ')}`);
    }
    throw error;
  }
}

/**
 * Get effective settings for a user's feed subscription
 */
export async function getUserFeedSettingsAction(feedId: string) {
  const session = await auth();

  if (!session?.user) {
    throw new Error('Unauthorized');
  }

  if (!feedId) {
    throw new Error('Feed ID is required');
  }

  const userFeed = await prisma.user_feeds.findUnique({
    where: {
      userId_feedId: {
        userId: session.user.id,
        feedId,
      },
    },
  });

  if (!userFeed) {
    throw new Error('Feed not found or not subscribed');
  }

  const effectiveSettings = await getEffectiveFeedSettings(session.user.id, feedId);

  const feedSettings = userFeed.settings as any;

  return {
    effective: effectiveSettings,
    overrides: {
      customName: userFeed.customName ?? null,
      refreshInterval: feedSettings?.refreshInterval ?? null,
      maxArticlesPerFeed: feedSettings?.maxArticlesPerFeed ?? null,
      maxArticleAge: feedSettings?.maxArticleAge ?? null,
    },
  };
}

/**
 * Update feed-specific settings for a user's subscription
 */
export async function updateUserFeedSettingsAction(feedId: string, input: FeedSettingsInput) {
  const session = await auth();

  if (!session?.user) {
    throw new Error('Unauthorized');
  }

  if (!feedId) {
    throw new Error('Feed ID is required');
  }

  try {
    const validated = feedSettingsSchema.parse(input);

    // Convert null to undefined for validation
    const settings = {
      refreshInterval: validated.refreshInterval ?? undefined,
      maxArticlesPerFeed: validated.maxArticlesPerFeed ?? undefined,
      maxArticleAge: validated.maxArticleAge ?? undefined,
    };

    // Validate settings
    const validation = validateFeedSettings(settings);
    if (!validation.valid) {
      throw new Error(`Invalid settings: ${validation.errors.join(', ')}`);
    }

    // Check if user is subscribed to this feed
    const userFeed = await prisma.user_feeds.findUnique({
      where: {
        userId_feedId: {
          userId: session.user.id,
          feedId,
        },
      },
    });

    if (!userFeed) {
      throw new Error('Feed not found or not subscribed');
    }

    // Get existing settings
    const existingSettings = (userFeed.settings as any) || {};

    // Merge with new settings (null values remove overrides)
    const newSettings = {
      ...existingSettings,
      ...(validated.refreshInterval !== undefined && {
        refreshInterval: validated.refreshInterval,
      }),
      ...(validated.maxArticlesPerFeed !== undefined && {
        maxArticlesPerFeed: validated.maxArticlesPerFeed,
      }),
      ...(validated.maxArticleAge !== undefined && {
        maxArticleAge: validated.maxArticleAge,
      }),
    };

    // Remove null values (they represent "use default")
    Object.keys(newSettings).forEach(key => {
      if (newSettings[key] === null) {
        delete newSettings[key];
      }
    });

    // Update user feed settings and custom name
    const updatedUserFeed = await prisma.user_feeds.update({
      where: {
        userId_feedId: {
          userId: session.user.id,
          feedId,
        },
      },
      data: {
        settings: newSettings,
        ...(validated.customName !== undefined && {
          customName: validated.customName || null,
        }),
      },
    });

    // Get effective settings after update
    const effectiveSettings = await getEffectiveFeedSettings(session.user.id, feedId);

    revalidatePath('/');
    revalidatePath('/feeds');
    revalidatePath(`/feeds/${feedId}`);

    return {
      success: true,
      settings: updatedUserFeed.settings,
      effective: effectiveSettings,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`Validation error: ${error.issues.map(e => e.message).join(', ')}`);
    }
    throw error;
  }
}

/**
 * Remove a feed from all categories (make it uncategorized)
 */
export async function removeFeedFromAllCategoriesAction(feedId: string) {
  const session = await auth();

  if (!session?.user) {
    throw new Error('Unauthorized');
  }

  if (!feedId) {
    throw new Error('Feed ID is required');
  }

  await unassignFeedFromAllCategories(session.user.id, feedId);

  revalidatePath('/');
  revalidatePath('/feeds');

  return { message: 'Feed removed from all categories successfully' };
}

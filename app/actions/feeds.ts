'use server';

/**
 * Server Actions for Feed operations
 *
 * These actions replace the following API routes:
 * - GET /api/feeds
 * - POST /api/feeds
 * - GET /api/feeds/[id]
 * - PATCH /api/feeds/[id]
 * - DELETE /api/feeds/[id]
 * - POST /api/feeds/validate
 * - POST /api/feeds/[id]/refresh
 * - GET /api/feeds/[id]/settings
 * - PUT /api/feeds/[id]/settings
 * - DELETE /api/feeds/[id]/settings
 */

import { auth } from '@/lib/auth';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import {
  getAllFeeds,
  getFeed,
  getFeedByUrl,
  validateAndCreateFeed,
  searchFeeds,
  getFeedsByCategory,
  updateFeed,
  deleteFeedWithArticles,
  getFeedStats,
  updateFeedCategories,
} from '@/lib/services/feed-service';
import {
  getExtractionSettings,
  updateExtractionSettings,
  clearExtractionSettings,
} from '@/lib/services/feed-settings-service';
import {
  parseFeedUrl,
  validateFeedUrl,
  normalizeFeedUrl,
  isSafeFeedUrl,
} from '@/lib/feed-parser';
import { refreshFeed } from '@/lib/services/feed-refresh-service';
import {
  createFeedRefreshNotification,
  cleanupOldNotifications,
} from '@/lib/services/notification-service';
import { prisma } from '@/lib/db';
import {
  createFeedSchema,
  updateFeedSchema,
  validateFeedSchema,
  feedQuerySchema,
  type CreateFeedInput,
  type UpdateFeedInput,
  type ValidateFeedInput,
  type FeedQueryInput,
} from '@/lib/validations/feed-validation';
import {
  updateExtractionSettingsSchema,
  type UpdateExtractionSettings,
} from '@/lib/validations/extraction-validation';
import type { ExtractionSettings } from '@/lib/extractors/types';

/**
 * Get paginated list of feeds
 * Supports filtering by category and search
 */
export async function getFeedsAction(input: FeedQueryInput) {
  try {
    const validated = feedQuerySchema.parse(input);
    const { page, limit, category, search } = validated;

    // Handle search
    if (search && search.trim()) {
      const feeds = await searchFeeds(search);
      return {
        feeds,
        total: feeds.length,
        page: 1,
        limit: feeds.length,
      };
    }

    // Handle category filter
    if (category && category.trim()) {
      const feeds = await getFeedsByCategory(category);
      return {
        feeds,
        total: feeds.length,
        page: 1,
        limit: feeds.length,
      };
    }

    // Get all feeds with pagination
    const result = await getAllFeeds({ page, limit });

    return {
      feeds: result.feeds,
      pagination: {
        page,
        limit,
        total: result.total,
        totalPages: Math.ceil(result.total / limit),
      },
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`Validation error: ${error.issues.map(e => e.message).join(', ')}`);
    }
    throw error;
  }
}

/**
 * Get a single feed by ID with statistics
 */
export async function getFeedAction(id: string) {
  if (!id) {
    throw new Error('Feed ID is required');
  }

  const [feed, stats] = await Promise.all([getFeed(id), getFeedStats(id)]);

  if (!feed) {
    throw new Error('Feed not found');
  }

  return { feed, stats };
}

/**
 * Create a new feed and optionally subscribe the user
 * Requires authentication
 */
export async function createFeedAction(input: CreateFeedInput) {
  const session = await auth();

  if (!session?.user) {
    throw new Error('Unauthorized');
  }

  try {
    const validated = createFeedSchema.parse(input);
    const { url, name, categoryIds } = validated;

    let feed;
    let isNewFeed = false;

    try {
      // Try to create the feed
      feed = await validateAndCreateFeed(url, name, categoryIds);
      isNewFeed = true;
    } catch (error) {
      // If feed already exists, get it instead
      if (error instanceof Error && error.message.includes('already exists')) {
        feed = await getFeedByUrl(url);

        if (!feed) {
          throw new Error('Feed exists but could not be retrieved');
        }
      } else {
        throw error;
      }
    }

    revalidatePath('/');
    revalidatePath('/feeds');

    return { feed, isNewFeed };
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`Validation error: ${error.issues.map(e => e.message).join(', ')}`);
    }
    throw error;
  }
}

/**
 * Update feed metadata
 * Requires authentication
 */
export async function updateFeedAction(id: string, input: UpdateFeedInput) {
  const session = await auth();

  if (!session?.user) {
    throw new Error('Unauthorized');
  }

  if (!id) {
    throw new Error('Feed ID is required');
  }

  try {
    const validated = updateFeedSchema.parse(input);
    const { categoryIds, ...updateData } = validated;

    const feed = await updateFeed(id, updateData);

    if (categoryIds !== undefined) {
      await updateFeedCategories(id, categoryIds);
    }

    revalidatePath('/');
    revalidatePath('/feeds');
    revalidatePath(`/feeds/${id}`);

    return { feed };
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`Validation error: ${error.issues.map(e => e.message).join(', ')}`);
    }
    throw error;
  }
}

/**
 * Delete a feed and all its articles
 * Requires authentication
 */
export async function deleteFeedAction(id: string) {
  const session = await auth();

  if (!session?.user) {
    throw new Error('Unauthorized');
  }

  if (!id) {
    throw new Error('Feed ID is required');
  }

  const feed = await getFeed(id);
  if (!feed) {
    throw new Error('Feed not found');
  }

  await deleteFeedWithArticles(id);

  revalidatePath('/');
  revalidatePath('/feeds');

  return { success: true };
}

/**
 * Validate a feed URL before adding it
 */
export async function validateFeedAction(input: ValidateFeedInput) {
  try {
    const validated = validateFeedSchema.parse(input);
    const { url } = validated;
    const normalizedUrl = normalizeFeedUrl(url);

    if (!isSafeFeedUrl(normalizedUrl)) {
      return {
        valid: false,
        error: 'Invalid or unsafe URL',
      };
    }

    const isValid = await validateFeedUrl(normalizedUrl);

    if (!isValid) {
      return {
        valid: false,
        error: 'Unable to parse feed or invalid feed format',
      };
    }

    try {
      const feedInfo = await parseFeedUrl(normalizedUrl);
      return {
        valid: true,
        feedInfo: {
          title: feedInfo.title,
          description: feedInfo.description,
          link: feedInfo.link,
          imageUrl: feedInfo.imageUrl,
          itemCount: feedInfo.items.length,
        },
      };
    } catch (error) {
      return {
        valid: false,
        error: 'Unable to fetch feed information',
      };
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`Validation error: ${error.issues.map(e => e.message).join(', ')}`);
    }
    throw error;
  }
}

/**
 * Manually refresh a feed
 * Creates notifications for subscribed users
 */
export async function refreshFeedAction(id: string) {
  const session = await auth();

  if (!id) {
    throw new Error('Feed ID is required');
  }

  const userId = session?.user?.id;

  const feed = await getFeed(id);
  if (!feed) {
    throw new Error('Feed not found');
  }

  const result = await refreshFeed(id, userId);

  if (!result.success) {
    throw new Error(result.error || 'Failed to refresh feed');
  }

  // Get all users subscribed to this feed
  const userFeeds = await prisma.user_feeds.findMany({
    where: { feedId: id },
    select: { userId: true },
  });

  const affectedUserIds = Array.from(new Set(userFeeds.map(uf => uf.userId)));

  // Create notifications for affected users (only if there are new/updated articles)
  if (affectedUserIds.length > 0 && (result.newArticles > 0 || result.updatedArticles > 0)) {
    for (const affectedUserId of affectedUserIds) {
      try {
        await createFeedRefreshNotification(affectedUserId, {
          totalFeeds: 1,
          successful: 1,
          failed: 0,
          newArticles: result.newArticles,
          updatedArticles: result.updatedArticles,
          articlesCleanedUp: result.cleanupResult?.deleted || 0,
          embeddingsGenerated: result.embeddingsGenerated || undefined,
          totalTokens: result.embeddingTokens || undefined,
          duration: `${(result.duration / 1000).toFixed(2)}s`,
        });

        await cleanupOldNotifications(affectedUserId);
      } catch (error) {
        // Log error but don't fail the request
        console.error(`Failed to create notification for user ${affectedUserId}`, error);
      }
    }
  }

  revalidatePath('/');
  revalidatePath('/feeds');
  revalidatePath(`/feeds/${id}`);

  return {
    success: true,
    newArticles: result.newArticles,
    updatedArticles: result.updatedArticles,
    duration: result.duration,
    embeddingsGenerated: result.embeddingsGenerated,
    articlesCleanedUp: result.cleanupResult?.deleted || 0,
  };
}

/**
 * Get extraction settings for a feed
 */
export async function getFeedExtractionSettingsAction(feedId: string) {
  if (!feedId) {
    throw new Error('Feed ID is required');
  }

  const settings = await getExtractionSettings(feedId);

  return { settings: settings || null };
}

/**
 * Update extraction settings for a feed
 */
export async function updateFeedExtractionSettingsAction(
  feedId: string,
  input: UpdateExtractionSettings
) {
  if (!feedId) {
    throw new Error('Feed ID is required');
  }

  try {
    const validated = updateExtractionSettingsSchema.parse(input);

    const updates = validated as Partial<ExtractionSettings> & { cookies?: string };

    const settings = await updateExtractionSettings(feedId, updates);

    revalidatePath(`/feeds/${feedId}`);

    return { settings };
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`Validation error: ${error.issues.map(e => e.message).join(', ')}`);
    }
    throw error;
  }
}

/**
 * Clear extraction settings for a feed
 */
export async function clearFeedExtractionSettingsAction(feedId: string) {
  if (!feedId) {
    throw new Error('Feed ID is required');
  }

  await clearExtractionSettings(feedId);

  revalidatePath(`/feeds/${feedId}`);

  return { message: 'Extraction settings cleared' };
}

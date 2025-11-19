/**
 * Feed Settings Cascade Service
 * Handles cascading configuration from user defaults → category settings → feed settings
 */

import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";

/**
 * Effective feed settings after applying cascade logic
 */
export interface EffectiveFeedSettings {
  refreshInterval: number; // in minutes
  maxArticlesPerFeed: number;
  maxArticleAge: number; // in days
  source: {
    refreshInterval: "feed" | "category" | "user" | "system";
    maxArticlesPerFeed: "feed" | "category" | "user" | "system";
    maxArticleAge: "feed" | "category" | "user" | "system";
  };
}

/**
 * Feed settings from JSON
 */
interface FeedSettingsJson {
  refreshInterval?: number;
  maxArticlesPerFeed?: number;
  maxArticleAge?: number;
}

/**
 * System defaults
 */
const SYSTEM_DEFAULTS = {
  refreshInterval: 60, // 60 minutes
  maxArticlesPerFeed: 500,
  maxArticleAge: 90, // 90 days
};

/**
 * Get effective feed settings for a user's feed subscription
 * Cascade priority: UserFeed > UserCategory > UserPreferences > Feed > System Default
 */
export async function getEffectiveFeedSettings(
  userId: string,
  feedId: string
): Promise<EffectiveFeedSettings> {
  try {
    // Get user's feed subscription with categories
    const userFeed = await prisma.userFeed.findUnique({
      where: {
        userId_feedId: {
          userId,
          feedId,
        },
      },
      include: {
        feed: true,
        userFeedCategories: {
          include: {
            userCategory: true,
          },
        },
      },
    });

    if (!userFeed) {
      // User not subscribed to this feed, use system defaults
      logger.warn("User not subscribed to feed, using system defaults", {
        userId,
        feedId,
      });
      return {
        refreshInterval: SYSTEM_DEFAULTS.refreshInterval,
        maxArticlesPerFeed: SYSTEM_DEFAULTS.maxArticlesPerFeed,
        maxArticleAge: SYSTEM_DEFAULTS.maxArticleAge,
        source: {
          refreshInterval: "system",
          maxArticlesPerFeed: "system",
          maxArticleAge: "system",
        },
      };
    }

    // Get user preferences
    const userPreferences = await prisma.userPreferences.findUnique({
      where: { userId },
    });

    // Initialize with system defaults
    let refreshInterval = SYSTEM_DEFAULTS.refreshInterval;
    let maxArticlesPerFeed = SYSTEM_DEFAULTS.maxArticlesPerFeed;
    let maxArticleAge = SYSTEM_DEFAULTS.maxArticleAge;

    const source = {
      refreshInterval: "system" as const,
      maxArticlesPerFeed: "system" as const,
      maxArticleAge: "system" as const,
    };

    // Apply user preferences defaults
    if (userPreferences) {
      if (userPreferences.defaultRefreshInterval) {
        refreshInterval = userPreferences.defaultRefreshInterval;
        source.refreshInterval = "user";
      }
      if (userPreferences.defaultMaxArticlesPerFeed) {
        maxArticlesPerFeed = userPreferences.defaultMaxArticlesPerFeed;
        source.maxArticlesPerFeed = "user";
      }
      if (userPreferences.defaultMaxArticleAge) {
        maxArticleAge = userPreferences.defaultMaxArticleAge;
        source.maxArticleAge = "user";
      }
    }

    // Apply category settings (if feed is in a category)
    // Note: If feed is in multiple categories, use the first one
    if (userFeed.userFeedCategories.length > 0) {
      const categorySettings = userFeed.userFeedCategories[0].userCategory
        .settings as FeedSettingsJson | null;

      if (categorySettings) {
        if (
          categorySettings.refreshInterval !== undefined &&
          categorySettings.refreshInterval !== null
        ) {
          refreshInterval = categorySettings.refreshInterval;
          source.refreshInterval = "category";
        }
        if (
          categorySettings.maxArticlesPerFeed !== undefined &&
          categorySettings.maxArticlesPerFeed !== null
        ) {
          maxArticlesPerFeed = categorySettings.maxArticlesPerFeed;
          source.maxArticlesPerFeed = "category";
        }
        if (
          categorySettings.maxArticleAge !== undefined &&
          categorySettings.maxArticleAge !== null
        ) {
          maxArticleAge = categorySettings.maxArticleAge;
          source.maxArticleAge = "category";
        }
      }
    }

    // Apply feed-specific settings (highest priority)
    const feedSettings = userFeed.settings as FeedSettingsJson | null;
    if (feedSettings) {
      if (
        feedSettings.refreshInterval !== undefined &&
        feedSettings.refreshInterval !== null
      ) {
        refreshInterval = feedSettings.refreshInterval;
        source.refreshInterval = "feed";
      }
      if (
        feedSettings.maxArticlesPerFeed !== undefined &&
        feedSettings.maxArticlesPerFeed !== null
      ) {
        maxArticlesPerFeed = feedSettings.maxArticlesPerFeed;
        source.maxArticlesPerFeed = "feed";
      }
      if (
        feedSettings.maxArticleAge !== undefined &&
        feedSettings.maxArticleAge !== null
      ) {
        maxArticleAge = feedSettings.maxArticleAge;
        source.maxArticleAge = "feed";
      }
    }

    return {
      refreshInterval,
      maxArticlesPerFeed,
      maxArticleAge,
      source,
    };
  } catch (error) {
    logger.error("Failed to get effective feed settings", {
      userId,
      feedId,
      error,
    });
    // Return system defaults on error
    return {
      refreshInterval: SYSTEM_DEFAULTS.refreshInterval,
      maxArticlesPerFeed: SYSTEM_DEFAULTS.maxArticlesPerFeed,
      maxArticleAge: SYSTEM_DEFAULTS.maxArticleAge,
      source: {
        refreshInterval: "system",
        maxArticlesPerFeed: "system",
        maxArticleAge: "system",
      },
    };
  }
}

/**
 * Get effective settings for all feeds a user is subscribed to
 */
export async function getAllUserFeedSettings(
  userId: string
): Promise<Map<string, EffectiveFeedSettings>> {
  const userFeeds = await prisma.userFeed.findMany({
    where: { userId },
    select: { feedId: true },
  });

  const settingsMap = new Map<string, EffectiveFeedSettings>();

  for (const userFeed of userFeeds) {
    const settings = await getEffectiveFeedSettings(userId, userFeed.feedId);
    settingsMap.set(userFeed.feedId, settings);
  }

  return settingsMap;
}

/**
 * Validate feed settings values
 */
export function validateFeedSettings(settings: Partial<FeedSettingsJson>): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (settings.refreshInterval !== undefined) {
    if (settings.refreshInterval < 15 || settings.refreshInterval > 1440) {
      errors.push("refreshInterval must be between 15 and 1440 minutes");
    }
  }

  if (settings.maxArticlesPerFeed !== undefined) {
    if (
      settings.maxArticlesPerFeed < 50 ||
      settings.maxArticlesPerFeed > 5000
    ) {
      errors.push("maxArticlesPerFeed must be between 50 and 5000");
    }
  }

  if (settings.maxArticleAge !== undefined) {
    if (settings.maxArticleAge < 1 || settings.maxArticleAge > 365) {
      errors.push("maxArticleAge must be between 1 and 365 days");
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Get system default settings
 */
export function getSystemDefaults(): EffectiveFeedSettings {
  return {
    refreshInterval: SYSTEM_DEFAULTS.refreshInterval,
    maxArticlesPerFeed: SYSTEM_DEFAULTS.maxArticlesPerFeed,
    maxArticleAge: SYSTEM_DEFAULTS.maxArticleAge,
    source: {
      refreshInterval: "system",
      maxArticlesPerFeed: "system",
      maxArticleAge: "system",
    },
  };
}

